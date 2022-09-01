import { mat3, vec2 } from "gl-matrix";
import Graph from "~/Graph";
import Grid from "~/Grid";
import { to } from "~/utils";
import { writable } from 'svelte/store';

import type {WorkerSettings, WorkerRequestMsg, WorkerResponseMsg, WorkerSettingsMsg, WorkerComputeMsg} from "~/worker";
import Worker from '~/worker?worker';

import WebGLw from "~/gl-helpers/WebGLw";
import ZoomPan from "~/ZoomPan";

export default class GraphController{
	
	glw: WebGLw;
	
	width = 0;
	height = 0;

	worker: Worker;
	workerSettings: WorkerSettings = { // TODO: make this a store
		expression: "x^2 - y",
		maxDepth: 10,
		showDebug: { tree: false, leaves: false},
		zeroExclusionAlgorithm: "IntervalAritmetic",
		zeroFindingAlgorithm: "RegulaFalsi"
	};

	running = false;
	startTime = 0;
	timingHistory: [number, number][] = [];
	thimingHistoryDuration = 10_000;


	graph: Graph;
	grid: Grid;
	zoomPan: ZoomPan;

	autoCalculate = false;

	expressionError = writable("");
	timingDisplay = writable("");


	constructor(private canvas_gl: HTMLCanvasElement, private canvas_2d: HTMLCanvasElement){
		this.glw = new WebGLw(this.canvas_gl);

		this.zoomPan = new ZoomPan(this.canvas_gl);
		this.zoomPan.onChange = () => this.render();
		this.graph = new Graph(this.glw);
		this.grid = new Grid(this.canvas_2d, this.zoomPan);

		// initialize web worker
		this.worker = new Worker();
		this.worker.onmessage = (e: MessageEvent) => this.onWorkerMessage(e);

		this.onResize();
		this.zoomPan.home();
		this.zoomPan.computeTransformations();
		this.onResize();


		// // initialize event listeners
		new ResizeObserver(() => this.onResize()).observe(this.canvas_gl);
	}

	setMaxDepth(depth: number){
		this.updateWorkerSettings({maxDepth: depth});
	}

	setDebugDisplay(value: string){
		let tree = (value === "show-all");
		let leaves = (value === "show-leaves") || (value === "show-all");

		this.updateWorkerSettings({showDebug: {tree, leaves}});
	}

	setZeroExclusionAlgorithm(value: string){
		this.updateWorkerSettings({zeroExclusionAlgorithm: value});
	}

	setZeroFindingAlgorithm(value: string){
		this.updateWorkerSettings({zeroFindingAlgorithm: value});
	}

	setAutoCalculate(value: boolean){
		this.autoCalculate = value;
	};

	setExpression(value: string){
		this.updateWorkerSettings({expression: value});
	}

	onResize(){
		let parent = this.canvas_gl.parentElement!;
		this.zoomPan.pixelRatio = window.devicePixelRatio;
		this.width = this.canvas_gl.width = parent.clientWidth * this.zoomPan.pixelRatio;
		this.height = this.canvas_gl.height = parent.clientHeight * this.zoomPan.pixelRatio;

		// set canvasToScreen
		mat3.fromScaling(this.zoomPan.canvasToScreen, 
			vec2.fromValues(this.width/2, -this.height/2)
		);
		mat3.translate(this.zoomPan.canvasToScreen, this.zoomPan.canvasToScreen, vec2.fromValues(1, -1));

		// set screenToCanvas
		mat3.invert(this.zoomPan.screenToCanvas, this.zoomPan.canvasToScreen);

		this.glw.resize();

		this.grid.resize(parent.clientWidth, parent.clientHeight);

		this.render();
	}

	render(){
		this.glw.clearCanvas();

		let t = mat3.mul(mat3.create(), this.zoomPan.screenToCanvas, this.zoomPan.graphToCanvas);

		this.graph.render(t);

		this.grid.render();
	}
	

	compute(){
		let {topLeft, bottomRight} = this.zoomPan.getViewport();
		if(this.running) return;
		this.running = true;
		this.startTime = Date.now();
		this.worker.postMessage(to<WorkerComputeMsg>({
			type: "compute",
			data: {
				x_inf: topLeft[0],
				x_sup: bottomRight[0],
				y_inf: bottomRight[1],
				y_sup: topLeft[1],
			}
		}));
	}

	updateWorkerSettings(settings: Partial<WorkerSettings>){
		this.workerSettings = {...this.workerSettings, ...settings};

		this.worker.postMessage(to<WorkerSettingsMsg>({
			type: "settings",
			data: this.workerSettings
		}));
	}

	onWorkerMessage(e: MessageEvent){
		let msg = e.data as WorkerResponseMsg;
		if(msg.type === "ready") this.updateWorkerSettings({});
		if(msg.type == "result"){
			let edges = msg.data.edges as Uint32Array;
			let vertices = msg.data.vertices as Float32Array;
			let edges_debug = msg.data.edges_debug as Uint32Array;
			let vertices_debug = msg.data.vertices_debug as Float32Array;
			this.graph.setPoints(vertices, edges);
			this.graph.setDebugPoints(vertices_debug, edges_debug);
			this.render();

			let endTime = Date.now();
			this.timingHistory.push([this.startTime, endTime]);
			this.timingHistory = this.timingHistory.filter(x => x[0] > endTime - this.thimingHistoryDuration);
			this.running = false;
			let duration = Date.now() - this.startTime;
			// this.durationDisplayElement.innerText = `computation time: ${duration}ms / ${(1000/duration).toFixed(2)} FPS `;
			this.timingDisplay.set(`computation time: ${duration}ms / ${(1000/duration).toFixed(2)} FPS `);
		}
		if(msg.type == "expression_changed"){
			this.compute();
			if(this.workerSettings.expression.length > 0){
				this.expressionError.set(msg.data.error);
			}
			else{
				this.expressionError.set("");
			}
		}
	}
}