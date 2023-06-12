import { vec2 } from "gl-matrix";
import type ZoomPan from "~/ZoomPan";
import {GrabbingArea} from "~/ZoomPan";
import type GraphController from "./GraphController";


class LeftHandle extends GrabbingArea{
	constructor(private intervalSelection: IntervalSelection){
		super();
	}

	move(delta: vec2): void {
		vec2.scale(delta, delta, 1/this.intervalSelection.zoomPan.zoom);
		this.intervalSelection.x_inf += delta[0];
		this.intervalSelection.update_y();
	}

	intersects(position: vec2): boolean {
		let inf_canvas = this.intervalSelection.zoomPan.graphToCanvasPoint(vec2.fromValues(this.intervalSelection.x_inf, this.intervalSelection.y_inf));
		let sup_canvas = this.intervalSelection.zoomPan.graphToCanvasPoint(vec2.fromValues(this.intervalSelection.x_sup, this.intervalSelection.y_sup));
		return Math.abs(inf_canvas[0] - position[0]) < 10;
	}
}


class RightHandle extends GrabbingArea{
	constructor(private intervalSelection: IntervalSelection){
		super();
	}

	move(delta: vec2): void {
		vec2.scale(delta, delta, 1/this.intervalSelection.zoomPan.zoom);
		this.intervalSelection.x_sup += delta[0];
		this.intervalSelection.update_y();
	}

	intersects(position: vec2): boolean {
		let inf_canvas = this.intervalSelection.zoomPan.graphToCanvasPoint(vec2.fromValues(this.intervalSelection.x_inf, this.intervalSelection.y_inf));
		let sup_canvas = this.intervalSelection.zoomPan.graphToCanvasPoint(vec2.fromValues(this.intervalSelection.x_sup, this.intervalSelection.y_sup));
		return Math.abs(sup_canvas[0] - position[0]) < 10;
	}
}

export default class IntervalSelection {
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;

	public x_inf = -1;
	public x_sup = 1;
	public y_inf = -1;
	public y_sup = 1;

	private left_handle: LeftHandle;
	private right_handle: RightHandle;

	constructor(private canvas: HTMLCanvasElement, public zoomPan: ZoomPan, public controller: GraphController){
		this.ctx = canvas.getContext('2d')!;
		this.width = canvas.width;
		this.height = canvas.height;

		this.left_handle = new LeftHandle(this);
		this.right_handle = new RightHandle(this);

		zoomPan.registerGrabbingArea(this.left_handle);
		zoomPan.registerGrabbingArea(this.right_handle);
	}

	resize(width: number, height: number){
		this.width = this.canvas.width = width * this.zoomPan.pixelRatio;
		this.height = this.canvas.height = height * this.zoomPan.pixelRatio;
	}

	render(){
		let inf_canvas = this.zoomPan.graphToCanvasPoint(vec2.fromValues(this.x_inf, this.y_inf));
		let sup_canvas = this.zoomPan.graphToCanvasPoint(vec2.fromValues(this.x_sup, this.y_sup));

		this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
		this.ctx.fillRect(inf_canvas[0], 0, sup_canvas[0] - inf_canvas[0], this.canvas.height);
		this.ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
		this.ctx.fillRect(0, inf_canvas[1], this.canvas.width, sup_canvas[1] - inf_canvas[1]);
	}

	update_y(){
		this.controller.evalAtInterval(Math.min(this.x_inf, this.x_sup), Math.max(this.x_sup, this.x_inf), 0, 0);
	}
}