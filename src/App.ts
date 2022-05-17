import {Point, Rect} from "ImplicitFunctionTracer";

type MouseState = {
	isDown: boolean;
	currentPosition: Point;
	startPosition: Point;
	currentPosition2: Point;
	startPosition2: Point;
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
		startPosition: [0, 0],
		currentPosition2: [0, 0],
		startPosition2: [0, 0]
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
		window.addEventListener('wheel', (e) => this.onMouseWheel(e), {passive: false});
		window.addEventListener('keydown', (e) => this.onKeyDown(e));
		window.addEventListener('keyup', (e) => this.onKeyUp(e));
		window.addEventListener('touchstart', (e) => this.onTouchStart(e), {passive: false});
		window.addEventListener('touchmove', (e) => this.onTouchMove(e));
		window.addEventListener('touchend', (e) => this.onTouchEnd(e));
	}

	homeViewport(){
		this.zoom = 2;
		this.offset = [this.canvas.width/2 / this.zoom, this.canvas.height/2 / this.zoom];
	}

	transform(){
		let dx = this.offset[0] * this.zoom;
		let dy = this.offset[1] * this.zoom;
		let a = this.zoom;
		let d = this.zoom;
		this.ctx.setTransform(a, 0, 0, d, dx, dy);
	}

	render(){
		this.ctx.resetTransform();
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fillStyle = '#fff';
		this.ctx.fillRect(this.canvas.width/2 - 2, this.canvas.height/2 - 2, 4, 4);
		this.transform();
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

		this.render();
	}

	onMouseWheel(e: WheelEvent){
		e.preventDefault();
		if(e.ctrlKey){
			this.zoomTouch(-e.deltaY/50, [e.clientX * this.pixelRatio, e.clientY * this.pixelRatio]);
		}
		else{
			var delta = Math.max(-1, Math.min(1, (e.deltaY || -e.detail)));
			if(delta == 0) return;
			this.zoomMouse(delta, [e.clientX * this.pixelRatio, e.clientY * this.pixelRatio]);
		}

		this.render();
	}

	onKeyDown(e: KeyboardEvent){}
	onKeyUp(e: KeyboardEvent){}

	onTouchStart(e: TouchEvent){
		e.preventDefault();
		if(e.touches.length == 1){
			this.mouseState.isDown = true;
			this.mouseState.startPosition = [e.touches[0].clientX, e.touches[0].clientY];
		}
		else if(e.touches.length == 2){
			this.mouseState.isDown = true;
			this.mouseState.startPosition = [e.touches[0].clientX, e.touches[0].clientY];
			this.mouseState.startPosition2 = [e.touches[1].clientX, e.touches[1].clientY];
		}
	}
	onTouchMove(e: TouchEvent){
		if(e.touches.length == 1){
			this.mouseState.currentPosition = [e.touches[0].clientX, e.touches[0].clientY];

			if(this.mouseState.isDown){
				this.pan([
					(this.mouseState.currentPosition[0] - this.mouseState.startPosition[0]) * this.pixelRatio,
					(this.mouseState.currentPosition[1] - this.mouseState.startPosition[1]) * this.pixelRatio
				]);

				this.mouseState.startPosition = this.mouseState.currentPosition;
			}
		}
		else if(e.touches.length == 2){
			this.mouseState.currentPosition = [e.touches[0].clientX, e.touches[0].clientY];
			this.mouseState.currentPosition2 = [e.touches[1].clientX, e.touches[1].clientY];

			if(this.mouseState.isDown){
				let startPositionCenter = [
					(this.mouseState.startPosition[0] + this.mouseState.startPosition2[0]) / 2,
					(this.mouseState.startPosition[1] + this.mouseState.startPosition2[1]) / 2
				];

				let currentPositionCenter = [
					(this.mouseState.currentPosition[0] + this.mouseState.currentPosition2[0]) / 2,
					(this.mouseState.currentPosition[1] + this.mouseState.currentPosition2[1]) / 2
				];

				this.pan([
					(currentPositionCenter[0] - startPositionCenter[0]) * this.pixelRatio,
					(currentPositionCenter[1] - startPositionCenter[1]) * this.pixelRatio
				]);

				let startDelta = Math.sqrt(
					Math.pow(this.mouseState.startPosition[0] - this.mouseState.startPosition2[0], 2) + 
					Math.pow(this.mouseState.startPosition[1] - this.mouseState.startPosition2[1], 2)
				);

				let currentDelta = Math.sqrt(
					Math.pow(this.mouseState.currentPosition[0] - this.mouseState.currentPosition2[0], 2) +
					Math.pow(this.mouseState.currentPosition[1] - this.mouseState.currentPosition2[1], 2)
				);

				let delta = (currentDelta - startDelta) / 100;

				this.zoomTouch(delta, [
					(this.mouseState.currentPosition[0] + this.mouseState.currentPosition2[0])/2 * this.pixelRatio, 
					(this.mouseState.currentPosition[1] + this.mouseState.currentPosition2[1])/2 * this.pixelRatio 
				]);

				this.mouseState.startPosition = this.mouseState.currentPosition;
				this.mouseState.startPosition2 = this.mouseState.currentPosition2;
			}
		}

		this.render();
	}
	onTouchEnd(e: TouchEvent){
		this.mouseState.isDown = false;
	}

	// viewport navigation
	pan(delta: Point){
		let [dx, dy] = delta;
		this.offset[0] += dx / this.zoom;
		this.offset[1] += dy / this.zoom;
	}

	zoomMouse(delta: number, position: Point){
		this.pan([-position[0], -position[1]]);
		
		if(delta > 0){
			this.zoom *= delta * 1.2;
		}
		else{
			this.zoom /= -delta * 1.2;
		}

		this.pan([position[0], position[1]]);
	}

	zoomTouch(delta: number, position: Point){
		this.pan([-position[0], -position[1]]);
		
		this.zoom += delta * this.zoom;

		this.pan([position[0], position[1]]);
	}

}