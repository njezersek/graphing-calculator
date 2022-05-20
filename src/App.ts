import {Mat, Vec} from "Math";
export default class App{
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	pixelRatio: number;

	offset= Vec.values([0, 0]);
	zoom: number = 1;

	mouseState = {
		isDown: false,
		currentPosition: Vec.values([0, 0]),
		startPosition: Vec.values([0, 0]),
		currentPosition2: Vec.values([0, 0]),
		startPosition2: Vec.values([0, 0])
	}


	constructor(){
		this.canvas = document.createElement('canvas');
		document.body.appendChild(this.canvas);
		let ctx = this.canvas.getContext('2d');
		if(!ctx) throw new Error('Could not get context');
		this.ctx = ctx;
		this.pixelRatio = window.devicePixelRatio;

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

	transform(){
		let offset = this.offset.mul(this.zoom);
		let a = this.zoom;
		let d = this.zoom;
		this.ctx.setTransform(a, 0, 0, d, offset.data[0], offset.data[1]);
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
		this.render();
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

		this.render();
	}
	onTouchEnd(e: TouchEvent){
		this.mouseState.isDown = false;
	}

	// viewport navigation
	pan(delta: Vec<2>){
		this.offset = this.offset.add(delta.div(this.zoom));
	}

	zoomMouse(delta: number, position: Vec<2>){
		this.pan(Vec.zeros(2).sub(position));
		
		if(delta > 0){
			this.zoom *= delta * 1.2;
		}
		else{
			this.zoom /= -delta * 1.2;
		}

		this.pan(position);
	}

	zoomTouch(delta: number, position: Vec<2>){
		this.pan(Vec.zeros(2).sub(position));

		
		this.zoom += delta * this.zoom;

		this.pan(position);
	}

}