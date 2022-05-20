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
		this.home();
		this.render();


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

	home(){
		this.zoom = Math.min(this.canvas.width, this.canvas.height) / 20;
		this.offset = Vec.values([this.canvas.width/2, this.canvas.height/2]).div(this.zoom);
	}

	transform(){
		let offset = this.offset.mul(this.zoom);
		let a = this.zoom;
		let d = this.zoom;
		this.ctx.setTransform(a, 0, 0, d, offset.data[0], offset.data[1]);
	}

	graphToCanvas(point: Vec<2>){
		return point.mul(Vec.values([1,-1])).add(this.offset).mul(this.zoom);
	}

	canvasToGraph(point: Vec<2>){
		return point.div(this.zoom).sub(this.offset).mul(Vec.values([1,-1]));
	}

	render(){
		// clear canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// test graphics
		let rows = 10;
		let cols = 10;
		for(let i = 0; i < rows; i++){
			for(let j = 0; j < cols; j++){
				this.ctx.fillStyle = 'red'
				let p1 = this.graphToCanvas(Vec.values([i, j]).mul(10));
				let p2 = this.graphToCanvas(Vec.values([i, j]).mul(10).add(5));
				let d = p2.sub(p1);

				this.ctx.fillRect(p1.data[0], p1.data[1], d.data[0], d.data[1]);
			}
		}

		// scale
		let centerCanvas = this.graphToCanvas(Vec.values([0, 0]));
		let centerCanvasLimited = centerCanvas.copy();
		if(centerCanvasLimited.data[0] < 40 * this.pixelRatio) centerCanvasLimited.data[0] = 40 * this.pixelRatio;
		if(centerCanvasLimited.data[0] > this.canvas.width) centerCanvasLimited.data[0] = this.canvas.width;
		if(centerCanvasLimited.data[1] < 0) centerCanvasLimited.data[1] = 0;
		if(centerCanvasLimited.data[1] > this.canvas.height - 18*this.pixelRatio) centerCanvasLimited.data[1] = this.canvas.height - 18*this.pixelRatio;
		let tickDeltaExp = Math.floor(Math.log10(300*this.pixelRatio / this.zoom));
		let tickDelta = Math.pow(10, tickDeltaExp);
		let tick = this.canvasToGraph(Vec.values([0, 0])).div(tickDelta).floor().mul(tickDelta);
		let tickCanvas = this.graphToCanvas(tick);
		// horizontal ticks
		let i = 0;
		let firstTickX = Math.round(tick.data[0] / tickDelta);
		while(tickCanvas.data[0] < this.canvas.width){
			// grid line
			this.ctx.fillStyle = '#333';
			this.ctx.fillRect(Math.round(tickCanvas.data[0]), 0, 1, this.canvas.height);
			// tick
			this.ctx.fillStyle = '#fff';
			this.ctx.fillRect(Math.round(tickCanvas.data[0]), Math.round(centerCanvas.data[1])-3*this.pixelRatio, 1, 7*this.pixelRatio);
			let tickLabel = this.label(firstTickX + i, tickDeltaExp);
			let tickLabelWidth = this.ctx.measureText(tickLabel).width;
			let zeroOffset = 0;
			if(tick.data[0] === 0) zeroOffset = -10;
			this.ctx.fillStyle = '#aaa';
			this.ctx.font = `${12 * this.pixelRatio}px sans-serif`;
			this.ctx.fillText(tickLabel, Math.round(tickCanvas.data[0] - tickLabelWidth/2 + zeroOffset), Math.round(centerCanvasLimited.data[1])+15*this.pixelRatio);
			i++;
			tick = this.canvasToGraph(Vec.values([0, 0])).div(tickDelta).floor().add(Vec.values([i, 0])).mul(tickDelta);
			tickCanvas = this.graphToCanvas(tick);
		}
		// vertical ticks
		let j = 0;
		let firstTickY = Math.round(tick.data[1] / tickDelta);
		while(tickCanvas.data[1] < this.canvas.height){
			// grid line
			this.ctx.fillStyle = '#333';
			this.ctx.fillRect(0, Math.round(tickCanvas.data[1]), this.canvas.width, 1);
			// tick
			this.ctx.fillStyle = '#fff';
			this.ctx.fillRect(Math.round(centerCanvas.data[0])-3*this.pixelRatio, Math.round(tickCanvas.data[1]), 7*this.pixelRatio, 1);
			if(tick.data[1] !== 0){	
				let tickLabel = this.label(firstTickY + j, tickDeltaExp);
				let tickLabelWidth = this.ctx.measureText(tickLabel).width;
				this.ctx.fillStyle = '#aaa';
				this.ctx.font = `${12 * this.pixelRatio}px sans-serif`;
				this.ctx.fillText(tickLabel, Math.round(centerCanvasLimited.data[0])-tickLabelWidth-10*this.pixelRatio, Math.round(tickCanvas.data[1])+5*this.pixelRatio);
			}
			j--;
			tick = this.canvasToGraph(Vec.values([0, 0])).div(tickDelta).floor().add(Vec.values([0, j])).mul(tickDelta);
			tickCanvas = this.graphToCanvas(tick);
		}
		// axes
		this.ctx.fillStyle = '#fff';
		this.ctx.fillRect(Math.round(centerCanvas.data[0]), 0, 1, this.canvas.height);
		this.ctx.fillRect(0, Math.round(centerCanvas.data[1]), this.canvas.width, 1);
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

}