import WebGLw, {glw} from "gl-helpers/WebGLw";
import { mat3, vec2 } from "gl-matrix";
import Grid from "Grid";
import Graph from "Graph";
export default class App{
	canvas: HTMLCanvasElement;
	backgroundCanvas: HTMLCanvasElement;
	input: HTMLInputElement;
	ctx: CanvasRenderingContext2D;
	pixelRatio: number;
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
		this.canvas = document.getElementById('canvas-gl') as HTMLCanvasElement;
		this.backgroundCanvas = document.getElementById('canvas-2d') as HTMLCanvasElement;
		this.input = document.getElementById('expression-input') as HTMLInputElement;

		new WebGLw(this.canvas);

		this.grid = new Grid();
		this.graph = new Graph();

		let ctx = this.backgroundCanvas.getContext('2d');
		if(!ctx) throw new Error('Could not get context');
		this.ctx = ctx;

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
		let v = vec2.clone(this.offset);
		vec2.scale(v, v, this.zoom);
		mat3.fromTranslation(this.graphToCanvas, v);
		mat3.scale(this.graphToCanvas, this.graphToCanvas, vec2.fromValues(this.zoom, -this.zoom));
	}

	home(){
		this.zoom = Math.min(this.canvas.width, this.canvas.height) / 20;
		this.offset = vec2.fromValues(this.canvas.width/2/this.zoom, this.canvas.height/2/this.zoom);
	}

	canvasToGraphPoint(point: vec2){
		let out = vec2.clone(point);
		vec2.scale(out, out, 1/this.zoom)
		vec2.sub(out, out, this.offset);
		vec2.mul(out, out, vec2.fromValues(1, -1));
		return out;
	}

	getViewport(){
		return {
			topLeft: this.canvasToGraphPoint(vec2.fromValues(0, 0)),
			bottomRight: this.canvasToGraphPoint(vec2.fromValues(this.canvas.width, this.canvas.height))
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
			// this.compute();
		}

		this.render();
	}

	onMouseWheel(e: WheelEvent){
		e.preventDefault();
		if(e.ctrlKey){
			this.zoomTouch(-e.deltaY/50, vec2.fromValues(e.clientX * this.pixelRatio, e.clientY * this.pixelRatio));
		}
		else{
			var delta = Math.max(-1, Math.min(1, (e.deltaY || -e.detail)));
			if(delta == 0) return;
			this.zoomMouse(delta, vec2.fromValues(e.clientX * this.pixelRatio, e.clientY * this.pixelRatio));
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

		// this.compute();
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

	onInput(){
		console.log(this.input.value);

		
		this.compute();
		this.render();
	}

	onResize(){
		this.pixelRatio = window.devicePixelRatio;
		this.width = this.canvas.width = this.backgroundCanvas.width = window.innerWidth * this.pixelRatio;
		this.height = this.canvas.height = this.backgroundCanvas.height = window.innerHeight * this.pixelRatio;

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

		this.graph.render(t);

		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.fillRect(100, 100, 10, 10);
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
				x_inf: topLeft[0],
				x_sup: bottomRight[0],
				y_inf: topLeft[1],
				y_sup: bottomRight[1],
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