import { mat3, vec2 } from "gl-matrix";
import Graph from "~/Graph";
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

	
	label(n: number, exp: number){
		if(n === 0) return '0';
		if(-3 <= exp && exp <= 0){
			return (n * 10**exp).toFixed(-exp);
		}
		if(0 <= exp && exp <= 3){
			return (n * 10**exp).toFixed(0);
		}
		return `${n}e${exp}`;
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
		this.width = this.canvas_gl.width = this.canvas_2d.width = parent.clientWidth * this.pixelRatio;
		this.height = this.canvas_gl.height = this.canvas_2d.height = parent.clientHeight * this.pixelRatio;

		// set canvasToScreen
		mat3.fromScaling(this.canvasToScreen, 
			vec2.fromValues(this.width/2, -this.height/2)
		);
		mat3.translate(this.canvasToScreen, this.canvasToScreen, vec2.fromValues(1, -1));

		// set screenToCanvas
		mat3.invert(this.screenToCanvas, this.canvasToScreen);

		this.glw.resize();

		this.render();

	}

	render(){
		this.glw.clearCanvas();

		let t = mat3.mul(mat3.create(), this.screenToCanvas, this.graphToCanvas);

		this.graph.render(t);

		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(0, 0, this.width, this.height);
	
		// scale
		let centerCanvas = this.graphToCanvasPoint(vec2.fromValues(0, 0));
		let centerCanvasLimited = vec2.clone(centerCanvas);
		if(centerCanvasLimited[0] < 40 * this.pixelRatio) centerCanvasLimited[0] = 40 * this.pixelRatio;
		if(centerCanvasLimited[0] > this.canvas_gl.width) centerCanvasLimited[0] = this.canvas_gl.width;
		if(centerCanvasLimited[1] < 0) centerCanvasLimited[1] = 0;
		if(centerCanvasLimited[1] > this.canvas_gl.height - 18*this.pixelRatio) centerCanvasLimited[1] = this.canvas_gl.height - 18*this.pixelRatio;
		let tickDeltaExp = Math.floor(Math.log10(300*this.pixelRatio / this.zoom));
		let tickDelta = Math.pow(10, tickDeltaExp);
		let tick = this.canvasToGraphPoint(vec2.fromValues(0, 0));
		vec2.scale(tick, tick, 1/tickDelta);
		vec2.floor(tick, tick);
		vec2.scale(tick, tick, tickDelta);

		let tickCanvas = this.graphToCanvasPoint(tick);

		// horizontal ticks
		let i = 0;
		let firstTickX = Math.round(tick[0] / tickDelta);
		while(tickCanvas[0] < this.canvas_gl.width){
			// grid line
			this.ctx.fillStyle = '#333';
			this.ctx.fillRect(Math.round(tickCanvas[0]), 0, 1, this.canvas_gl.height);
			// tick
			this.ctx.fillStyle = '#fff';
			this.ctx.fillRect(Math.round(tickCanvas[0]), Math.round(centerCanvas[1])-3*this.pixelRatio, 1, 7*this.pixelRatio);
			let tickLabel = this.label(firstTickX + i, tickDeltaExp);
			let tickLabelWidth = this.ctx.measureText(tickLabel).width;
			let zeroOffset = 0;
			if(tick[0] === 0) zeroOffset = -10;
			this.ctx.fillStyle = '#aaa';
			this.ctx.font = `${12 * this.pixelRatio}px sans-serif`;
			this.ctx.fillText(tickLabel, Math.round(tickCanvas[0] - tickLabelWidth/2 + zeroOffset), Math.round(centerCanvasLimited[1])+15*this.pixelRatio);

			// move to next tick
			i++;
			tick = this.canvasToGraphPoint(vec2.fromValues(0, 0));
			vec2.scale(tick, tick, 1/tickDelta);
			vec2.floor(tick, tick);
			vec2.add(tick, tick, vec2.fromValues(i, 0));
			vec2.scale(tick, tick, tickDelta);

			tickCanvas = this.graphToCanvasPoint(tick);
		}
		// vertical ticks
		let j = 0;
		let firstTickY = Math.round(tick[1] / tickDelta);
		while(tickCanvas[1] < this.canvas_gl.height){
			// grid line
			this.ctx.fillStyle = '#333';
			this.ctx.fillRect(0, Math.round(tickCanvas[1]), this.canvas_gl.width, 1);
			// tick
			this.ctx.fillStyle = '#fff';
			this.ctx.fillRect(Math.round(centerCanvas[0])-3*this.pixelRatio, Math.round(tickCanvas[1]), 7*this.pixelRatio, 1);
			if(tick[1] !== 0){	
				let tickLabel = this.label(firstTickY - j, tickDeltaExp);
				let tickLabelWidth = this.ctx.measureText(tickLabel).width;
				this.ctx.fillStyle = '#aaa';
				this.ctx.font = `${12 * this.pixelRatio}px sans-serif`;
				this.ctx.fillText(tickLabel, Math.round(centerCanvasLimited[0])-tickLabelWidth-10*this.pixelRatio, Math.round(tickCanvas[1])+5*this.pixelRatio);
			}
			j++;
			tick = this.canvasToGraphPoint(vec2.fromValues(0, 0));
			vec2.scale(tick, tick, 1/tickDelta);
			vec2.floor(tick, tick);
			vec2.add(tick, tick, vec2.fromValues(0, -j));
			vec2.scale(tick, tick, tickDelta);

			tickCanvas = this.graphToCanvasPoint(tick);
		}
		// axes
		this.ctx.fillStyle = '#fff';
		this.ctx.fillRect(Math.round(centerCanvas[0]), 0, 1, this.canvas_gl.height);
		this.ctx.fillRect(0, Math.round(centerCanvas[1]), this.canvas_gl.width, 1);
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