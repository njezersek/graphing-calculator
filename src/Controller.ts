import { mat3, vec2 } from "gl-matrix";

export default class Controller{


	graphToCanvas = mat3.create();

	canvasToScreen = mat3.create();
	screenToCanvas = mat3.create();

	mouseStart = vec2.create();
	mouseDown = false;

	pixelRatio = 1;
	width = 0;
	height = 0;
	
	constructor(private canvas: HTMLCanvasElement){
		
		// resize
		window.addEventListener('resize', () => this.onResize());
		
		// mouse controlls
		canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
		canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
		canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
		canvas.addEventListener('wheel', (e) => this.onMouseWheel(e), {passive: false});

		// touch controlls
		// canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), {passive: false});
		// canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
		// canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

		this.onResize();
	}

	onResize(){
		this.pixelRatio = window.devicePixelRatio;
		this.width = this.canvas.width = window.innerWidth * this.pixelRatio;
		this.height = this.canvas.height = window.innerHeight * this.pixelRatio;


		mat3.fromScaling(this.canvasToScreen, 
			vec2.fromValues(this.width/2, -this.height/2)
		);

		mat3.translate(this.canvasToScreen, this.canvasToScreen, vec2.fromValues(1, -1));

		mat3.invert(this.screenToCanvas, this.canvasToScreen);
	}

	onMouseDown(e: MouseEvent){
		let transform = mat3.mul(
			mat3.create(), 
			this.screenToCanvas, 
			mat3.invert(mat3.create(), this.graphToCanvas)
		);

		vec2.set(this.mouseStart, e.offsetX, e.offsetY);
		vec2.transformMat3(this.mouseStart, this.mouseStart, transform);
		console.log(this.mouseStart);
		
		this.mouseDown = true;
	}

	onMouseMove(e: MouseEvent){
		if(this.mouseDown){
			let transform = mat3.mul(
				mat3.create(), 
				this.screenToCanvas, 
				mat3.invert(mat3.create(), this.graphToCanvas)
			);

			let mouseCurr = vec2.fromValues(e.offsetX, e.offsetY)
			vec2.transformMat3(mouseCurr, mouseCurr, transform);

			let delta = vec2.subtract(vec2.create(), mouseCurr, this.mouseStart);

			mat3.translate(this.graphToCanvas, this.graphToCanvas, delta);

			vec2.copy(this.mouseStart, mouseCurr);
		}
	}

	onMouseUp(e: MouseEvent){
		this.mouseDown = false;
	}

	onMouseWheel(e: WheelEvent){
		e.preventDefault();
		mat3.scale(this.graphToCanvas, this.graphToCanvas, vec2.fromValues(e.deltaY > 0 ? 1.1 : 0.9, e.deltaY > 0 ? 1.1 : 0.9));
	}
}