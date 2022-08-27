import WebGLw, {glw} from "gl-helpers/WebGLw";
import { mat3, vec2 } from "gl-matrix";
import Grid from "Grid";
import Graph from "Graph";
export default class App{
	
	expressionInput = document.getElementById('expression-input') as HTMLInputElement;
	expressionError = document.getElementById("expression-error") as HTMLPreElement;
	calculateButton = document.getElementById('calculate-button') as HTMLButtonElement;
	autoCalculateCheckbox = document.getElementById('auto-calculate-checkbox') as HTMLInputElement;
	quadTreeDisplaySelect = document.getElementById('quad-tree-display-select') as HTMLSelectElement;
	maxDepthInput = document.getElementById('max-depth-input') as HTMLInputElement;
	maxDepthDisplay = document.getElementById('max-depth-display') as HTMLSpanElement;
	zeroExclusionAlgorithmSelct = document.getElementById('zero-exclusion-algorithm-select') as HTMLSelectElement;
	zeroFindingAlgorithmSelect = document.getElementById('zero-finding-algorithm-select') as HTMLSelectElement;
	menuElement = document.getElementById('menu') as HTMLDivElement;
	openMenuButton = document.getElementById('open-menu-button') as HTMLButtonElement;
	hideMenuButton = document.getElementById('hide-menu-button') as HTMLButtonElement;

	canvas = document.getElementById('canvas-gl') as HTMLCanvasElement;
	backgroundCanvas = document.getElementById('canvas-2d') as HTMLCanvasElement;
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

	autoCalculate = false;


	// transformations
	screenToCanvas = mat3.create();
	canvasToScreen = mat3.create();
	
	canvasToGraph = mat3.create(); 
	graphToCanvas = mat3.create();
	
	screenToGraph = mat3.create();
	graphToScreen = mat3.create();

	constructor(){
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
		this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
		this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
		this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
		this.canvas.addEventListener('wheel', (e) => this.onMouseWheel(e), {passive: false});
		this.canvas.addEventListener('keydown', (e) => this.onKeyDown(e));
		this.canvas.addEventListener('keyup', (e) => this.onKeyUp(e));
		this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), {passive: false});
		this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
		this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
		this.expressionInput.addEventListener('input', () => this.onInput());
		this.autoCalculateCheckbox.addEventListener('change', e => this.autoCalculate = this.autoCalculateCheckbox.checked);
		this.calculateButton.addEventListener('click', () => this.compute());
		this.quadTreeDisplaySelect.addEventListener('change', e => this.setDebugDisplay(this.quadTreeDisplaySelect.value));
		this.maxDepthInput.addEventListener('input', e => this.setMaxDepth(parseInt(this.maxDepthInput.value)));
		this.zeroExclusionAlgorithmSelct.addEventListener('change', e => this.setZeroExclusionAlgorithm(this.zeroExclusionAlgorithmSelct.value));
		this.zeroFindingAlgorithmSelect.addEventListener('change', e => this.setZeroFindingAlgorithm(this.zeroFindingAlgorithmSelect.value));
		this.hideMenuButton.addEventListener('click', e => this.menuElement.style.left = '-510px');
		this.openMenuButton.addEventListener('click', e => this.menuElement.style.left = '10px');

		setInterval(() => this.worker.postMessage("Hello Worker!"), 1000);

		console.log(`MAX_ELEMENT_INDEX: ${glw.gl.getParameter(glw.gl.MAX_ELEMENT_INDEX)}, MAX_ELEMENTS_VERTICES: ${glw.gl.getParameter(glw.gl.MAX_ELEMENTS_VERTICES)}, MAX_ELEMENTS_INDICES: ${glw.gl.getParameter(glw.gl.MAX_ELEMENTS_INDICES)}`);
	}

	setMaxDepth(depth: number){
		this.worker.postMessage({
			type: "settings",
			data: {
				key: "max_depth",
				value: depth
			}
		});

		this.maxDepthDisplay.innerText = depth.toString();

		this.compute();
	}

	setDebugDisplay(value: string){
		let showTree = false;
		let showLeaves = false;
		if(value === "hide"){
			showTree = false;
			showLeaves = false;
		}
		else if(value === "show-all"){
			showTree = true;
			showLeaves = true;
		}
		else if(value === "show-leaves"){
			showTree = false;
			showLeaves = true;
		}

		this.worker.postMessage({
			type: "settings",
			data: {
				key: "debug_tree",
				showDebugTree: showTree,
				showDebugLeaves: showLeaves
			}
		});

		this.compute();
	}

	setZeroExclusionAlgorithm(value: string){
		this.worker.postMessage({
			type: "settings",
			data: {
				key: "zero_exclusion_algorithm",
				value: value
			}
		});

		this.compute();
	}

	setZeroFindingAlgorithm(value: string){
		this.worker.postMessage({
			type: "settings",
			data: {
				key: "zero_finding_algorithm",
				value: value
			}
		});

		this.compute();
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
			if(this.autoCalculate) this.compute();
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

	onInput(){
		console.log(this.expressionInput.value);

		this.worker.postMessage({
			type: "settings",
			data: {
				key: "expression",
				value: this.expressionInput.value
			}
		});	
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
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(0, 0, this.width, this.height);
	
		// scale
		let centerCanvas = this.graphToCanvasPoint(vec2.fromValues(0, 0));
		let centerCanvasLimited = vec2.clone(centerCanvas);
		if(centerCanvasLimited[0] < 40 * this.pixelRatio) centerCanvasLimited[0] = 40 * this.pixelRatio;
		if(centerCanvasLimited[0] > this.canvas.width) centerCanvasLimited[0] = this.canvas.width;
		if(centerCanvasLimited[1] < 0) centerCanvasLimited[1] = 0;
		if(centerCanvasLimited[1] > this.canvas.height - 18*this.pixelRatio) centerCanvasLimited[1] = this.canvas.height - 18*this.pixelRatio;
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
		while(tickCanvas[0] < this.canvas.width){
			// grid line
			this.ctx.fillStyle = '#333';
			this.ctx.fillRect(Math.round(tickCanvas[0]), 0, 1, this.canvas.height);
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
		while(tickCanvas[1] < this.canvas.height){
			// grid line
			this.ctx.fillStyle = '#333';
			this.ctx.fillRect(0, Math.round(tickCanvas[1]), this.canvas.width, 1);
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
		this.ctx.fillRect(Math.round(centerCanvas[0]), 0, 1, this.canvas.height);
		this.ctx.fillRect(0, Math.round(centerCanvas[1]), this.canvas.width, 1);
	}
	

	compute(){
		let {topLeft, bottomRight} = this.getViewport();
		if(this.running) return;
		this.running = true;
		this.startTime = Date.now();
		this.worker.postMessage({
			type: "compute",
			data: {
				expression: this.expressionInput.value,
				width: this.canvas.width,
				height: this.canvas.height,
				offset: this.offset,
				zoom: this.zoom,
				pixelRatio: this.pixelRatio,
				topLeft: topLeft,
				bottomRight: bottomRight,
				x_inf: topLeft[0],
				x_sup: bottomRight[0],
				y_inf: bottomRight[1],
				y_sup: topLeft[1],
			}
		});
	}

	onWorkerMessage(e: MessageEvent){
		let data = e.data.data;
		if(e.data.type == "result"){
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
		if(e.data.type == "expression_changed"){
			this.compute();
			if(this.expressionInput.value.length > 0){
				this.expressionError.innerHTML = data.error;
			}
			else{
				this.expressionError.innerHTML = "";
			}
		}
	}
}