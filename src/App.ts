import {Point, Rect} from "ImplicitFunctionTracer";

type MouseState = {
	isDown: boolean;
	currentPosition: Point;
	startPosition: Point;
};

export default class App{
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	pixelRatio: number;

	viewport: Rect;

	offset: Point = [0, 0];
	zoom: number = 1;

	mouseState: MouseState = {
		isDown: false,
		currentPosition: [0, 0],
		startPosition: [0, 0]
	}


	constructor(){
		this.canvas = document.createElement('canvas');
		document.body.appendChild(this.canvas);
		let ctx = this.canvas.getContext('2d');
		if(!ctx) throw new Error('Could not get context');
		this.ctx = ctx;
		this.pixelRatio = window.devicePixelRatio;
		this.viewport = [0, 0, this.canvas.width, this.canvas.height];
		this.homeViewport();

		this.onResize();

		// initialize event listeners
		window.addEventListener('resize', () => this.onResize());
		window.addEventListener('mousedown', (e) => this.onMouseDown(e));
		window.addEventListener('mousemove', (e) => this.onMouseMove(e));
		window.addEventListener('mouseup', (e) => this.onMouseUp(e));
		window.addEventListener('wheel', (e) => this.onMouseWheel(e));
		window.addEventListener('keydown', (e) => this.onKeyDown(e));
		window.addEventListener('keyup', (e) => this.onKeyUp(e));
		window.addEventListener('touchstart', (e) => this.onTouchStart(e));
		window.addEventListener('touchmove', (e) => this.onTouchMove(e));
		window.addEventListener('touchend', (e) => this.onTouchEnd(e));
	}

	homeViewport(){
		let w = this.canvas.width;
		let h = this.canvas.height;
		let maxDimension = Math.max(w, h);
		this.viewport = [-w / maxDimension, -h / maxDimension, w / maxDimension, h / maxDimension];
	}
	
	transformInverse(){
		let w = this.canvas.width;
		let h = this.canvas.height;
		let [dx, dy, bx, by] = this.viewport;
		this.ctx.setTransform((bx - dx)/w, 0, 0, (by - dy)/h, dx, dy);
	}

	transform(){
		let w = this.canvas.width;
		let h = this.canvas.height;
		let [ax, ay, bx, by] = this.viewport;
		let a = w / (bx - ax);
		let d = h / (by - ay);
		let dx = -a * ax;
		let dy = -d * ay;
		this.ctx.setTransform(a, 0, 0, d, dx, dy);
	}

	transform2(){
		let w = this.canvas.width;
		let h = this.canvas.height;
		let dx = w / 2 + this.offset[0];
		let dy = h / 2 + this.offset[1];
		let a = this.zoom;
		let d = this.zoom;
		this.ctx.setTransform(a, 0, 0, d, dx, dy);
	}

	render(){
		this.ctx.resetTransform();
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.transform2();
		console.log("render!")
		let rows = 10;
		let cols = 10;
		for(let i = 0; i < rows; i++){
			for(let j = 0; j < cols; j++){
				this.ctx.fillStyle = 'red'
				this.ctx.fillRect(i*10, j*10, 5, 5);
			}
		}
	}


	// event listeners
	onResize(){
		this.pixelRatio = window.devicePixelRatio;
		this.canvas.width = window.innerWidth * this.pixelRatio;
		this.canvas.height = window.innerHeight * this.pixelRatio;
		this.homeViewport();
		this.render();
	}

	onMouseDown(e: MouseEvent){
		this.mouseState.isDown = true;
		this.mouseState.startPosition = [e.clientX, e.clientY];
	}

	onMouseUp(e: MouseEvent){
		this.mouseState.isDown = false;
	}

	onMouseMove(e: MouseEvent){
		this.mouseState.currentPosition = [e.clientX, e.clientY];
		
		if(this.mouseState.isDown){
			this.pan([
				(this.mouseState.currentPosition[0] - this.mouseState.startPosition[0]) * this.pixelRatio,
				(this.mouseState.currentPosition[1] - this.mouseState.startPosition[1]) * this.pixelRatio
			]);

			this.mouseState.startPosition = this.mouseState.currentPosition;
		}
	}

	onMouseWheel(e: WheelEvent){
	}

	onKeyDown(e: KeyboardEvent){}
	onKeyUp(e: KeyboardEvent){}

	onTouchStart(e: TouchEvent){
		this.mouseState.isDown = true;
		this.mouseState.startPosition = [e.touches[0].clientX, e.touches[0].clientY];
	}
	onTouchMove(e: TouchEvent){
		this.mouseState.currentPosition = [e.touches[0].clientX, e.touches[0].clientY];

		if(this.mouseState.isDown){
			this.pan([
				(this.mouseState.currentPosition[0] - this.mouseState.startPosition[0]) * this.pixelRatio,
				(this.mouseState.currentPosition[1] - this.mouseState.startPosition[1]) * this.pixelRatio
			]);

			this.mouseState.startPosition = this.mouseState.currentPosition;
		}
	}
	onTouchEnd(e: TouchEvent){
		this.mouseState.isDown = false;
	}

	// viewport navigation
	pan(delta: Point){
		let [dx, dy] = delta;
		this.offset[0] += dx/this.zoom;
		this.offset[1] += dy/this.zoom;
		this.render();
	}

}