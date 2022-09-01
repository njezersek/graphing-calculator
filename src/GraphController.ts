import { mat3, vec2 } from "gl-matrix";
import Graph from "~/Graph";
import Grid from "~/Grid";
import { to } from "~/utils";
import { writable } from 'svelte/store';

import type {WorkerSettings, WorkerRequestMsg, WorkerResponseMsg, WorkerSettingsMsg, WorkerComputeMsg} from "~/worker";
import Worker from '~/worker?worker';

import WebGLw from "~/gl-helpers/WebGLw";

export default class GraphController{
	
	ctx: CanvasRenderingContext2D;
	glw: WebGLw;
	
	pixelRatio = 1;
	width = 0;
	height = 0;

	offset = vec2.fromValues(0, 0);
	zoom: number = 3;

	mouseState = {
		isDown: false,
		currentPosition: vec2.fromValues(0, 0),
		startPosition: vec2.fromValues(0, 0),
		currentPosition2: vec2.fromValues(0, 0),
		startPosition2: vec2.fromValues(0, 0)
	}

	worker: Worker;
	workerSettings: WorkerSettings = {
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

	autoCalculate = false;

	expressionError = writable("");
	timingDisplay = writable("");


	// transformations
	screenToCanvas = mat3.create();
	canvasToScreen = mat3.create();
	
	canvasToGraph = mat3.create(); 
	graphToCanvas = mat3.create();
	
	screenToGraph = mat3.create();
	graphToScreen = mat3.create();

	constructor(private canvas_gl: HTMLCanvasElement, private canvas_2d: HTMLCanvasElement){
		this.glw = new WebGLw(this.canvas_gl);

		this.graph = new Graph(this.glw);
		this.grid = new Grid(this.canvas_2d, (p: vec2) => this.graphToCanvasPoint(p), (p: vec2) => this.canvasToGraphPoint(p));

		let ctx = this.canvas_2d.getContext('2d');
		if(!ctx) throw new Error('Could not get context');
		this.ctx = ctx;

		// initialize web worker
		this.worker = new Worker();
		this.worker.onmessage = (e: MessageEvent) => this.onWorkerMessage(e);

		this.onResize();
		this.home();
		this.computeTransformations();
		this.onResize();


		// // initialize event listeners
		new ResizeObserver(() => this.onResize()).observe(this.canvas_gl);
		this.canvas_gl.addEventListener('mousedown', (e) => this.onMouseDown(e));
		this.canvas_gl.addEventListener('mousemove', (e) => this.onMouseMove(e));
		this.canvas_gl.addEventListener('mouseup', (e) => this.onMouseUp(e));
		this.canvas_gl.addEventListener('wheel', (e) => this.onMouseWheel(e), {passive: false});
		this.canvas_gl.addEventListener('keydown', (e) => this.onKeyDown(e));
		this.canvas_gl.addEventListener('keyup', (e) => this.onKeyUp(e));
		this.canvas_gl.addEventListener('touchstart', (e) => this.onTouchStart(e), {passive: false});
		this.canvas_gl.addEventListener('touchmove', (e) => this.onTouchMove(e));
		this.canvas_gl.addEventListener('touchend', (e) => this.onTouchEnd(e));

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
		console.log("setAutoCalculate", value);
		this.autoCalculate = value;
	};

	computeTransformations(){
		let v = vec2.clone(this.offset);
		vec2.scale(v, v, this.zoom);
		mat3.fromTranslation(this.graphToCanvas, v);
		mat3.scale(this.graphToCanvas, this.graphToCanvas, vec2.fromValues(this.zoom, -this.zoom));
	}

	home(){
		console.log("home", this.canvas_gl.width, this.canvas_gl.height, this.canvas_gl.parentElement!.clientWidth, this.canvas_gl.parentElement!.clientHeight);
		this.zoom = Math.min(this.canvas_gl.width, this.canvas_gl.height) / 20;
		this.offset = vec2.fromValues(this.canvas_gl.width/2/this.zoom, this.canvas_gl.height/2/this.zoom);
	}

	canvasToGraphPoint(point: vec2){
		let out = vec2.clone(point);
		vec2.scale(out, out, 1/this.zoom)
		vec2.sub(out, out, this.offset);
		vec2.mul(out, out, vec2.fromValues(1, -1));
		return out;
	}

	graphToCanvasPoint(point: vec2){
		let out = vec2.clone(point);
		vec2.mul(out, out, vec2.fromValues(1, -1));
		vec2.add(out, out, this.offset);
		vec2.scale(out, out, this.zoom);
		return out;
	}

	getViewport(){
		return {
			topLeft: this.canvasToGraphPoint(vec2.fromValues(0, 0)),
			bottomRight: this.canvasToGraphPoint(vec2.fromValues(this.canvas_gl.width, this.canvas_gl.height))
		}
	}


	onMouseDown(e: MouseEvent){
		this.mouseState.isDown = true;
		this.mouseState.startPosition = vec2.fromValues(e.clientX, e.clientY);
	}

	onMouseUp(e: MouseEvent){
		this.mouseState.isDown = false;
	}

	onMouseMove(e: MouseEvent){
		this.mouseState.currentPosition = vec2.fromValues(e.clientX, e.clientY);
		
		if(this.mouseState.isDown){
			let delta = vec2.sub(vec2.create(), this.mouseState.currentPosition, this.mouseState.startPosition);
			vec2.scale(delta, delta, this.pixelRatio);
			this.pan(delta);

			this.mouseState.startPosition = this.mouseState.currentPosition;
			if(this.autoCalculate) this.compute();
		}

		this.render();
	}

	onMouseWheel(e: WheelEvent){
		e.preventDefault();
		if(e.ctrlKey){
			this.zoomTouch(-e.deltaY/50, vec2.fromValues(e.offsetX * this.pixelRatio, e.offsetY * this.pixelRatio));
		}
		else{
			var delta = Math.max(-1, Math.min(1, (e.deltaY || -e.detail)));
			if(delta == 0) return;
			this.zoomMouse(delta, vec2.fromValues(e.offsetX * this.pixelRatio, e.offsetY * this.pixelRatio));
		}

		if(this.autoCalculate) this.compute();
		this.render();
	}

	onKeyDown(e: KeyboardEvent){}
	onKeyUp(e: KeyboardEvent){}

	onTouchStart(e: TouchEvent){
		e.preventDefault();
		if(e.touches.length == 1){
			this.mouseState.isDown = true;
			this.mouseState.startPosition = vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY);
		}
		else if(e.touches.length == 2){
			this.mouseState.isDown = true;
			this.mouseState.startPosition = vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY);
			this.mouseState.startPosition2 = vec2.fromValues(e.touches[1].clientX, e.touches[1].clientY);
		}
	}
	onTouchMove(e: TouchEvent){
		if(e.touches.length == 1){
			this.mouseState.currentPosition = vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY);

			if(this.mouseState.isDown){
				let delta = vec2.sub(vec2.create(), this.mouseState.currentPosition, this.mouseState.startPosition);
				vec2.scale(delta, delta, this.pixelRatio);
				this.pan(delta);

				this.mouseState.startPosition = this.mouseState.currentPosition;
			}
		}
		else if(e.touches.length == 2){
			this.mouseState.currentPosition = vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY);
			this.mouseState.currentPosition2 = vec2.fromValues(e.touches[1].clientX, e.touches[1].clientY);

			if(this.mouseState.isDown){
				let startPositionCenter = vec2.add(vec2.create(), this.mouseState.startPosition, this.mouseState.startPosition2);
				vec2.scale(startPositionCenter, startPositionCenter, 0.5);

				let currentPositionCenter = vec2.add(vec2.create(), this.mouseState.currentPosition, this.mouseState.currentPosition2);
				vec2.scale(currentPositionCenter, currentPositionCenter, 0.5);

				let delta = vec2.sub(vec2.create(), currentPositionCenter, startPositionCenter);
				vec2.scale(delta, delta, this.pixelRatio);

				this.pan(delta);

				let startDelta = vec2.distance(this.mouseState.startPosition, this.mouseState.startPosition2);
				let currentDelta = vec2.distance(this.mouseState.currentPosition, this.mouseState.currentPosition2);
				let deltaZoom = (currentDelta - startDelta) / 100;

				let pos = vec2.add(vec2.create(), this.mouseState.currentPosition, this.mouseState.currentPosition2);
				vec2.scale(pos, pos, 0.5 * this.pixelRatio);
				this.zoomTouch(deltaZoom, pos);

				this.mouseState.startPosition = this.mouseState.currentPosition;
				this.mouseState.startPosition2 = this.mouseState.currentPosition2;
			}
		}

		if(this.autoCalculate) this.compute();
		this.render();
	}
	onTouchEnd(e: TouchEvent){
		this.mouseState.isDown = false;
	}

	// viewport navigation
	pan(delta: vec2){
		vec2.add(this.offset, this.offset, vec2.scale(vec2.create(), delta, 1/this.zoom));
		this.computeTransformations();
		this.render();
	}

	zoomMouse(delta: number, position: vec2){
		this.pan(vec2.scale(vec2.create(), position, -1));
		
		if(delta > 0){
			this.zoom *= delta * 1.2;
		}
		else{
			this.zoom /= -delta * 1.2;
		}

		this.pan(position);
	}

	zoomTouch(delta: number, position: vec2){
		this.pan(vec2.scale(vec2.create(), position, -1));

		
		this.zoom += delta * this.zoom;

		this.pan(position);
	}

	setExpression(value: string){
		this.updateWorkerSettings({expression: value});
	}

	onResize(){
		this.pixelRatio = window.devicePixelRatio;
		let parent = this.canvas_gl.parentElement!;
		this.width = this.canvas_gl.width = parent.clientWidth * this.pixelRatio;
		this.height = this.canvas_gl.height = parent.clientHeight * this.pixelRatio;

		// set canvasToScreen
		mat3.fromScaling(this.canvasToScreen, 
			vec2.fromValues(this.width/2, -this.height/2)
		);
		mat3.translate(this.canvasToScreen, this.canvasToScreen, vec2.fromValues(1, -1));

		// set screenToCanvas
		mat3.invert(this.screenToCanvas, this.canvasToScreen);

		this.glw.resize();

		this.grid.resize(this.width, this.height);

		this.render();

	}

	render(){
		this.glw.clearCanvas();

		let t = mat3.mul(mat3.create(), this.screenToCanvas, this.graphToCanvas);

		this.graph.render(t);

		this.grid.render(this.zoom);
	}
	

	compute(){
		let {topLeft, bottomRight} = this.getViewport();
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