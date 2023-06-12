import { mat3, vec2 } from "gl-matrix";
import Graph from "~/Graph";
import Grid from "~/Grid";
import { to } from "~/utils";
import { writable, get } from 'svelte/store';

import type {WorkerSettings, WorkerEvalAtIntervalMsg, WorkerResponseMsg, WorkerSettingsMsg, WorkerComputeMsg} from "~/worker";
import Worker from '~/worker?worker';

import WebGLw from "~/gl-helpers/WebGLw";
import ZoomPan from "~/ZoomPan";
import Timer from "~/Timer";
import IntervalSelection from "./IntervalSelection";

export default class GraphController{
	
	protected glw: WebGLw;
	
	protected width = 0;
	protected height = 0;

	protected workerInitiated = false;

	// member objects
	protected worker: Worker;
	protected graph: Graph;
	protected grid: Grid;
	protected zoomPan: ZoomPan;
	timer = new Timer();
	
	// settings stores
	expression = writable("x^2+(1.2*y-|0.9*x|^(2/3))^2=1");
	maxDepth = writable(10);
	showDebug = writable("hide");
	zeroExclusionAlgorithm = writable("IntervalAritmetic");
	zeroFindingAlgorithm = writable("RegulaFalsi");

	autoCalculate = writable(true);
	expressionError = writable("");
	timingDisplay = writable("");

	interval_selection: IntervalSelection | null = null;

	mediaQueryLightTheme: MediaQueryList;


	constructor(protected canvas_gl: HTMLCanvasElement, protected canvas_2d: HTMLCanvasElement){

		// initialize web worker
		this.worker = new Worker();
		this.worker.onmessage = (e: MessageEvent) => this.onWorkerMessage(e);

		this.glw = new WebGLw(this.canvas_gl);

		this.zoomPan = new ZoomPan(this.canvas_gl);
		this.zoomPan.onChange = () => this.render();
		this.graph = new Graph(this.glw);
		this.grid = new Grid(this.canvas_2d, this.zoomPan);

		// comment this out to disable interval selection
		// this.interval_selection = new IntervalSelection(this.canvas_2d, this.zoomPan, this);
		
		this.onResize();
		this.zoomPan.home();
		this.zoomPan.computeTransformations();
		this.onResize();

		// // initialize event listeners
		new ResizeObserver(() => this.onResize()).observe(this.canvas_gl);


		this.autoCalculate.subscribe((value) => {
			if(value) this.compute();
		});

		this.zoomPan.onChange = () => {
			this.render();
			let {topLeft, bottomRight} = this.zoomPan.getViewport();
			this.updateWorkerSettings({rect: {
				x_inf: topLeft[0],
				x_sup: bottomRight[0],
				y_inf: bottomRight[1],
				y_sup: topLeft[1],
			}});

			if(get(this.autoCalculate)) this.compute();
		}

		this.expression.subscribe((value) => {
			this.updateWorkerSettings({expression: value});
			this.compute();
		});

		this.maxDepth.subscribe((value) => {
			this.updateWorkerSettings({maxDepth: value});
			this.compute();
		});

		this.zeroExclusionAlgorithm.subscribe((value) => {
			this.updateWorkerSettings({zeroExclusionAlgorithm: value});
			this.compute();
		});

		this.zeroFindingAlgorithm.subscribe((value) => {
			this.updateWorkerSettings({zeroFindingAlgorithm: value});
			this.compute();
		});

		this.showDebug.subscribe((value) => {
			this.updateWorkerSettings({showDebug: value});
			this.compute();
		});

		this.mediaQueryLightTheme = window.matchMedia("(prefers-color-scheme: light)");
		this.mediaQueryLightTheme.onchange = () => this.onMediaQueryChange();
		this.onMediaQueryChange();
	}

	onMediaQueryChange(){
		if(this.mediaQueryLightTheme.matches){
			this.graph.graphColor = [0,0,1,1];
			this.graph.debugGridColor = [0.3,0.4,0.5,0.7];
			this.grid.backgroundColor = "#fff";
			this.grid.axisColor = "#000";
			this.grid.labelColor = "#333";
			this.grid.gridColor = "#eee";

		}
		else{
			this.graph.graphColor = [1,1,0,1];
			this.graph.debugGridColor = [0.3,0.4,0.5,0.7];
			this.grid.backgroundColor = "#000";
			this.grid.axisColor = "#fff";
			this.grid.labelColor = "#aaa";
			this.grid.gridColor = "#333";
		}

		this.render();
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

		if(this.interval_selection){
			this.interval_selection.render();
		}
	}
	

	compute(){
		if(!this.workerInitiated) return;
		if(this.timer.isRunning()) return;
		this.timer.start();
		this.worker.postMessage(to<WorkerComputeMsg>({
			type: "compute"
		}));
	}

	private initWorkerSettings() {
		let {topLeft, bottomRight} = this.zoomPan.getViewport();

		let settings: WorkerSettings = {
			maxDepth: get(this.maxDepth),
			zeroExclusionAlgorithm: get(this.zeroExclusionAlgorithm),
			zeroFindingAlgorithm: get(this.zeroFindingAlgorithm),
			expression: get(this.expression),
			showDebug: get(this.showDebug),
			rect: {
				x_inf: topLeft[0],
				x_sup: bottomRight[0],
				y_inf: bottomRight[1],
				y_sup: topLeft[1],
			}
		};

		this.worker.postMessage(to<WorkerSettingsMsg>({
			type: "settings",
			data: settings
		}));

		this.workerInitiated = true;
	}

	private updateWorkerSettings(settings: Partial<WorkerSettings>){
		this.worker.postMessage(to<WorkerSettingsMsg>({
			type: "settings",
			data: settings
		}));
	}

	public evalAtInterval(x_inf: number, x_sup: number, y_inf: number, y_sup: number){
		this.worker.postMessage(to<WorkerEvalAtIntervalMsg>({
			type: "eval_at_interval",
			data: {
				x_inf,
				x_sup,
				y_inf,
				y_sup
			}
		}));
	}

	onWorkerMessage(e: MessageEvent){
		let msg = e.data as WorkerResponseMsg;
		if(msg.type === "ready") this.initWorkerSettings();
		if(msg.type == "result"){
			let edges = msg.data.edges as Uint32Array;
			let vertices = msg.data.vertices as Float32Array;
			let edges_debug = msg.data.edges_debug as Uint32Array;
			let vertices_debug = msg.data.vertices_debug as Float32Array;
			this.graph.setPoints(vertices, edges);
			this.graph.setDebugPoints(vertices_debug, edges_debug);
			this.render();

			this.timer.stop();
			this.timingDisplay.set(`${this.timer.getTime().toFixed(2)} ms / ${(1000/this.timer.getTime()).toFixed(2)} FPS `);
		}
		if(msg.type == "expression_changed"){
			if(this.interval_selection){
				this.interval_selection.update_y();
			}
			this.compute();
			if(get(this.expression).length > 0){
				this.expressionError.set(msg.data.error);
			}
			else{
				this.expressionError.set("");
			}
		}
		if(msg.type == "eval_at_interval_result"){
			if(this.interval_selection){
				this.interval_selection.y_inf = msg.data.inf;
				this.interval_selection.y_sup = msg.data.sup;
				this.render();
			}
		}

	}

	renderToLatex(){
		let t = mat3.mul(mat3.create(), this.zoomPan.screenToCanvas, this.zoomPan.graphToCanvas);
		let s = this.graph.renderToLatex(t);
		console.log(s)
		return s;
	}
}