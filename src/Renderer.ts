import WebGLw, {glw} from "gl-helpers/WebGLw";
import { mat3, vec2 } from "gl-matrix";
import Grid from "Grid";

export default class Renderer{
	
	// canvas properties
	pixelRatio = 1;
	width = 0;
	height = 0;
	
	// transformations
	screenToCanvas = mat3.create();
	canvasToScreen = mat3.create();
	
	canvasToGraph = mat3.create(); 
	graphToCanvas = mat3.create();
	
	screenToGraph = mat3.create();
	graphToScreen = mat3.create();

	// mouse
	mouseDown = false;
	mouseStart = vec2.create(); // in graph coordinates
	mouseCurrent = vec2.create(); // in graph coordinates
	
	
	grid: Grid;

	constructor(private canvas: HTMLCanvasElement){
		document.body.appendChild(this.canvas);

		new WebGLw(this.canvas);

		this.grid = new Grid();


		// resize
		window.addEventListener('resize', () => this.onResize());

		// mouse controlls
		canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
		canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
		canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
		canvas.addEventListener('wheel', (e) => this.onMouseWheel(e), {passive: false});

		this.onResize();
	}

	computeTransformations(){
		// graphToCanvas is set by user


		// set canvasToGraph
		mat3.invert(this.canvasToGraph, this.graphToCanvas);

		// set canvasToScreen
		mat3.fromScaling(this.canvasToScreen, 
			vec2.fromValues(this.width/2, -this.height/2)
		);
		mat3.translate(this.canvasToScreen, this.canvasToScreen, vec2.fromValues(1, -1));

		// set screenToCanvas
		mat3.invert(this.screenToCanvas, this.canvasToScreen);

		// set screenToGraph
		mat3.mul(this.screenToGraph, this.screenToCanvas, this.canvasToGraph);

		// set graphToScreen
		mat3.mul(this.graphToScreen, this.graphToCanvas, this.canvasToScreen);
	}

	onResize(){
		this.pixelRatio = window.devicePixelRatio;
		this.width = this.canvas.width = window.innerWidth * this.pixelRatio;
		this.height = this.canvas.height = window.innerHeight * this.pixelRatio;

		this.computeTransformations();

		this.render();
	}

	onMouseDown(e: MouseEvent){
		vec2.set(this.mouseStart, e.offsetX*this.pixelRatio, e.offsetY*this.pixelRatio);
		vec2.transformMat3(this.mouseStart, this.mouseStart, this.screenToGraph);
		
		this.mouseDown = true;
	}

	onMouseMove(e: MouseEvent){
		if(this.mouseDown){
			let mouseCurr = vec2.fromValues(e.offsetX*this.pixelRatio, e.offsetY*this.pixelRatio)
			vec2.transformMat3(mouseCurr, mouseCurr, this.screenToGraph);

			let delta = vec2.subtract(vec2.create(), mouseCurr, this.mouseStart);

			mat3.translate(this.graphToCanvas, this.graphToCanvas, delta);

			vec2.copy(this.mouseStart, mouseCurr);

			this.computeTransformations();

			this.render();
		}
	}

	onMouseUp(e: MouseEvent){
		this.mouseDown = false;
	}

	onMouseWheel(e: WheelEvent){
		e.preventDefault();
		mat3.scale(this.graphToCanvas, this.graphToCanvas, vec2.fromValues(e.deltaY > 0 ? 1.1 : 0.9, e.deltaY > 0 ? 1.1 : 0.9));

		this.computeTransformations();

		this.render();
	}

	render(){
		glw.clearCanvas();
		this.grid.render(this.canvasToGraph);
	}
}