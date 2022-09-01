import { vec2 } from "gl-matrix";

export default class Grid{
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;
	pixelRatio = 1;

	constructor(private canvas: HTMLCanvasElement, private graphToCanvasPoint: (p: vec2) => vec2, private canvasToGraphPoint: (p: vec2) => vec2){
		this.ctx = canvas.getContext('2d')!;
		this.width = canvas.width;
		this.height = canvas.height;
		this.pixelRatio = window.devicePixelRatio;
	}

	resize(width: number, height: number){
		this.width = this.canvas.width = width * this.pixelRatio;
		this.height = this.canvas.height = height * this.pixelRatio;
	}

	render(zoom: number){
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
		let tickDeltaExp = Math.floor(Math.log10(300*this.pixelRatio / zoom ));
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

	private label(n: number, exp: number){
		if(n === 0) return '0';
		if(-3 <= exp && exp <= 0){
			return (n * 10**exp).toFixed(-exp);
		}
		if(0 <= exp && exp <= 3){
			return (n * 10**exp).toFixed(0);
		}
		return `${n}e${exp}`;
	}
}