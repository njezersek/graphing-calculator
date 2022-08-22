import WebGLw, {glw} from "gl-helpers/WebGLw";
import { mat3, vec2 } from "gl-matrix";

import {Mat, Vec} from "Math";

import Grid from "Grid";
import Graph from "Graph";
export default class App{
	canvas: HTMLCanvasElement;
	input: HTMLInputElement;
	// ctx: CanvasRenderingContext2D;
	pixelRatio: number;
	width = 0;
	height = 0;

	offset = Vec.values([0, 0]);
	zoom: number = 3;

	V: Vec<2>[] = [];
	E: [number, number, string, number][] = [];


	/*
	MAX_ELEMENT_INDEX: 4294967294, MAX_ELEMENTS_VERTICES: 2147483647, MAX_ELEMENTS_INDICES: 2147483647

	funkcije:
		x**2 + y**2 - 1
		x**2 + y**2 + 3*Math.sin(10*x**3) - 1    						x^2 + y^2 + 3*sin(10*x^3) - 1
		Math.sqrt((x-1)**2 + y**2)*Math.sqrt((x+1)**2 + y**2) - 1
	*/
	// tracer = new IntervalQuadTreeTracer();

	mouseState = {
		isDown: false,
		currentPosition: Vec.values([0, 0]),
		startPosition: Vec.values([0, 0]),
		currentPosition2: Vec.values([0, 0]),
		startPosition2: Vec.values([0, 0])
	}

	worker: Worker;
	running = false;
	startTime = 0;


	grid: Grid;
	graph: Graph;


	// transformations
	screenToCanvas = mat3.create();
	canvasToScreen = mat3.create();
	
	canvasToGraph = mat3.create(); 
	graphToCanvas = mat3.create();
	
	screenToGraph = mat3.create();
	graphToScreen = mat3.create();

	constructor(){
		this.canvas = document.createElement('canvas');
		this.input = document.createElement('input');
		this.input.style.position = 'absolute';
		this.input.style.top = '0';
		this.input.style.width = '500px';
		this.input.style.padding = '5px';
		document.body.appendChild(this.canvas);
		document.body.appendChild(this.input);

		new WebGLw(this.canvas);

		this.grid = new Grid();
		this.graph = new Graph();

		// let ctx = this.canvas.getContext('2d');
		// if(!ctx) throw new Error('Could not get context');
		// this.ctx = ctx;
		this.pixelRatio = window.devicePixelRatio;

		// initialize web worker
		this.worker = new Worker('./bundle-worker.js');
		this.worker.onmessage = (e: MessageEvent) => this.onWorkerMessage(e);

		this.onResize();
		this.home();
		this.computeTransformations();
		this.onResize();


		// // initialize event listeners
		window.addEventListener('resize', () => this.onResize());
		window.addEventListener('mousedown', (e) => this.onMouseDown(e));
		window.addEventListener('mousemove', (e) => this.onMouseMove(e));
		window.addEventListener('mouseup', (e) => this.onMouseUp(e));
		window.addEventListener('wheel', (e) => this.onMouseWheel(e), {passive: false});
		window.addEventListener('keydown', (e) => this.onKeyDown(e));
		window.addEventListener('keyup', (e) => this.onKeyUp(e));
		window.addEventListener('touchstart', (e) => this.onTouchStart(e), {passive: false});
		window.addEventListener('touchmove', (e) => this.onTouchMove(e));
		window.addEventListener('touchend', (e) => this.onTouchEnd(e));
		this.input.addEventListener('input', () => this.onInput());

		setInterval(() => this.worker.postMessage("Hello Worker!"), 1000);

		console.log(`MAX_ELEMENT_INDEX: ${glw.gl.getParameter(glw.gl.MAX_ELEMENT_INDEX)}, MAX_ELEMENTS_VERTICES: ${glw.gl.getParameter(glw.gl.MAX_ELEMENTS_VERTICES)}, MAX_ELEMENTS_INDICES: ${glw.gl.getParameter(glw.gl.MAX_ELEMENTS_INDICES)}`);
	}

	computeTransformations(){
		let v = vec2.fromValues(this.offset.x, this.offset.y);
		vec2.scale(v, v, this.zoom);
		mat3.fromTranslation(this.graphToCanvas, v);
		mat3.scale(this.graphToCanvas, this.graphToCanvas, vec2.fromValues(this.zoom, -this.zoom));
	}

	home(){
		this.zoom = Math.min(this.canvas.width, this.canvas.height) / 20;
		this.offset = Vec.values([this.canvas.width/2, this.canvas.height/2]).div(this.zoom);
	}

	// transform(){
	// 	let offset = this.offset.mul(this.zoom);
	// 	let a = this.zoom;
	// 	let d = this.zoom;
	// 	// this.ctx.setTransform(a, 0, 0, d, offset.data[0], offset.data[1]);
	// }

	// graphToCanvas(point: Vec<2>){
	// 	return point.mul(Vec.values([1,-1])).add(this.offset).mul(this.zoom);
	// }

	canvasToGraphPoint(point: Vec<2>){
		return point.div(this.zoom).sub(this.offset).mul(Vec.values([1,-1]));
	}

	getViewport(){
		return {
			topLeft: this.canvasToGraphPoint(Vec.values([0, 0])),
			bottomRight: this.canvasToGraphPoint(Vec.values([this.canvas.width, this.canvas.height]))
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
		this.mouseState.startPosition = Vec.values([e.clientX, e.clientY]);
	}

	onMouseUp(e: MouseEvent){
		this.mouseState.isDown = false;
	}

	onMouseMove(e: MouseEvent){
		this.mouseState.currentPosition = Vec.values([e.clientX, e.clientY]);
		
		if(this.mouseState.isDown){
			this.pan(this.mouseState.currentPosition.sub(this.mouseState.startPosition).mul(this.pixelRatio));

			this.mouseState.startPosition = this.mouseState.currentPosition;
			// this.compute();
		}

		this.render();
	}

	onMouseWheel(e: WheelEvent){
		e.preventDefault();
		if(e.ctrlKey){
			this.zoomTouch(-e.deltaY/50, Vec.values([e.clientX * this.pixelRatio, e.clientY * this.pixelRatio]));
		}
		else{
			var delta = Math.max(-1, Math.min(1, (e.deltaY || -e.detail)));
			if(delta == 0) return;
			this.zoomMouse(delta, Vec.values([e.clientX * this.pixelRatio, e.clientY * this.pixelRatio]));
		}

		// this.compute();
		this.render();
	}

	onKeyDown(e: KeyboardEvent){}
	onKeyUp(e: KeyboardEvent){}

	onTouchStart(e: TouchEvent){
		e.preventDefault();
		if(e.touches.length == 1){
			this.mouseState.isDown = true;
			this.mouseState.startPosition = Vec.values([e.touches[0].clientX, e.touches[0].clientY]);
		}
		else if(e.touches.length == 2){
			this.mouseState.isDown = true;
			this.mouseState.startPosition = Vec.values([e.touches[0].clientX, e.touches[0].clientY]);
			this.mouseState.startPosition2 = Vec.values([e.touches[1].clientX, e.touches[1].clientY]);
		}
	}
	onTouchMove(e: TouchEvent){
		if(e.touches.length == 1){
			this.mouseState.currentPosition = Vec.values([e.touches[0].clientX, e.touches[0].clientY]);

			if(this.mouseState.isDown){
				this.pan(this.mouseState.currentPosition.sub(this.mouseState.startPosition).mul(this.pixelRatio));

				this.mouseState.startPosition = this.mouseState.currentPosition;
			}
		}
		else if(e.touches.length == 2){
			this.mouseState.currentPosition = Vec.values([e.touches[0].clientX, e.touches[0].clientY]);
			this.mouseState.currentPosition2 = Vec.values([e.touches[1].clientX, e.touches[1].clientY]);

			if(this.mouseState.isDown){
				let startPositionCenter = this.mouseState.startPosition.add(this.mouseState.startPosition2).div(2);
				let currentPositionCenter = this.mouseState.currentPosition.add(this.mouseState.currentPosition2).div(2);

				this.pan(currentPositionCenter.sub(startPositionCenter).mul(this.pixelRatio));

				let startDelta = this.mouseState.startPosition.sub(this.mouseState.startPosition2).norm();
				let currentDelta = this.mouseState.currentPosition.sub(this.mouseState.currentPosition2).norm();
				let delta = (currentDelta - startDelta) / 100;

				this.zoomTouch(delta, this.mouseState.currentPosition.add(this.mouseState.currentPosition2).div(2).mul(this.pixelRatio));

				this.mouseState.startPosition = this.mouseState.currentPosition;
				this.mouseState.startPosition2 = this.mouseState.currentPosition2;
			}
		}

		// this.compute();
		this.render();
	}
	onTouchEnd(e: TouchEvent){
		this.mouseState.isDown = false;
	}

	// viewport navigation
	pan(delta: Vec<2>){
		this.offset = this.offset.add(delta.div(this.zoom));
		// console.log(this.offset.data);
		this.computeTransformations();
		this.render();
	}

	zoomMouse(delta: number, position: Vec<2>){
		this.pan(position.neg());
		
		if(delta > 0){
			this.zoom *= delta * 1.2;
		}
		else{
			this.zoom /= -delta * 1.2;
		}

		this.pan(position);
	}

	zoomTouch(delta: number, position: Vec<2>){
		this.pan(position.neg());

		
		this.zoom += delta * this.zoom;

		this.pan(position);
	}

	onInput(){
		console.log(this.input.value);

		
		this.compute();
		this.render();
	}

	onResize(){
		this.pixelRatio = window.devicePixelRatio;
		this.width = this.canvas.width = window.innerWidth * this.pixelRatio;
		this.height = this.canvas.height = window.innerHeight * this.pixelRatio;

		// set canvasToScreen
		mat3.fromScaling(this.canvasToScreen, 
			vec2.fromValues(this.width/2, -this.height/2)
		);
		mat3.translate(this.canvasToScreen, this.canvasToScreen, vec2.fromValues(1, -1));

		// set screenToCanvas
		mat3.invert(this.screenToCanvas, this.canvasToScreen);

		glw.resize();

		this.render();
	}

	render(){
		glw.clearCanvas();

		let t = mat3.mul(mat3.create(), this.screenToCanvas, this.graphToCanvas);

		// this.grid.render(t);
		this.graph.render(t);
	}
	

	compute(){
		let {topLeft, bottomRight} = this.getViewport();
		if(this.running) return;
		this.running = true;
		this.startTime = Date.now();
		this.worker.postMessage({
			type: "compute",
			data: {
				expression: this.input.value,
				width: this.canvas.width,
				height: this.canvas.height,
				offset: this.offset,
				zoom: this.zoom,
				pixelRatio: this.pixelRatio,
				topLeft: topLeft,
				bottomRight: bottomRight,
				x_inf: topLeft.x,
				x_sup: bottomRight.x,
				y_inf: topLeft.y,
				y_sup: bottomRight.y,
			}
		});
	}

	onWorkerMessage(e: MessageEvent){
		if(e.data.type == "result"){
			let data = e.data.data;
			console.log(data);
			let edges = data.edges as Uint32Array;
			let vertices = data.vertices as Float32Array;
			let edges_debug = data.edges_debug as Uint32Array;
			let vertices_debug = data.vertices_debug as Float32Array;
			this.graph.setPoints(vertices, edges);
			this.graph.setDebugPoints(vertices_debug, edges_debug);
			this.render();
			this.running = false;
			console.log(`computation time: ${Date.now() - this.startTime}ms`);
		}
		if(e.data.type == "error"){
			this.running = false;
			console.log(`computation time: ${Date.now() - this.startTime}ms`);
		}
	}
}