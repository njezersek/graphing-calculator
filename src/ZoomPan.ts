import { mat3, vec2 } from "gl-matrix";

export abstract class GrabbingArea{
	abstract move(delata: vec2): void;

	abstract intersects(position: vec2): boolean;
}
export default class ZoomPan{
	offset = vec2.fromValues(0, 0);
	zoom: number = 3;
	pixelRatio = 1; // TODO: this is a bit of a hack, but it works for now

	// transformations
	screenToCanvas = mat3.create();
	canvasToScreen = mat3.create();
	
	canvasToGraph = mat3.create(); 
	graphToCanvas = mat3.create();
	
	screenToGraph = mat3.create();
	graphToScreen = mat3.create();

	grabingAreas: GrabbingArea[] = [];
	activeGrabingArea: GrabbingArea | null = null;

	public onChange = () => {};

	mouseState = {
		isDown: false,
		currentPosition: vec2.fromValues(0, 0),
		startPosition: vec2.fromValues(0, 0),
		currentPosition2: vec2.fromValues(0, 0),
		startPosition2: vec2.fromValues(0, 0)
	}

	constructor(private container: HTMLElement){
		this.pixelRatio = window.devicePixelRatio;

		container.addEventListener('mousedown', (e) => this.onMouseDown(e));
		container.addEventListener('mousemove', (e) => this.onMouseMove(e));
		container.addEventListener('mouseup', (e) => this.onMouseUp(e));
		container.addEventListener('wheel', (e) => this.onMouseWheel(e), {passive: false});
		container.addEventListener('touchstart', (e) => this.onTouchStart(e), {passive: false});
		container.addEventListener('touchmove', (e) => this.onTouchMove(e));
		container.addEventListener('touchend', (e) => this.onTouchEnd(e));
	}

	registerGrabbingArea(area: GrabbingArea){
		this.grabingAreas.push(area);
	}

	unregisterGrabbingArea(area: GrabbingArea){
		let index = this.grabingAreas.indexOf(area);
		if(index != -1){
			this.grabingAreas.splice(index, 1);
		}
	}

	checkGrabbingAreas(position: vec2){
		for(let area of this.grabingAreas){
			if(area.intersects(position)){
				return area;
			}
		}
		return null;
	}

	home(){
		this.zoom = Math.min(this.container.offsetWidth * this.pixelRatio, this.container.offsetHeight * this.pixelRatio) / 20;
		this.offset = vec2.fromValues(this.container.offsetWidth/2/this.zoom * this.pixelRatio, this.container.offsetHeight/2/this.zoom * this.pixelRatio);
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
			bottomRight: this.canvasToGraphPoint(vec2.fromValues(this.container.offsetWidth * this.pixelRatio, this.container.offsetHeight * this.pixelRatio))
		}
	}

	onMouseDown(e: MouseEvent){
		let p = vec2.fromValues(e.offsetX * this.pixelRatio, e.offsetY * this.pixelRatio);
		this.mouseState.startPosition = p;
		this.activeGrabingArea = this.checkGrabbingAreas(p);
		if(this.activeGrabingArea) return;
		this.mouseState.isDown = true;
	}

	onMouseUp(e: MouseEvent){
		this.activeGrabingArea = null;
		this.mouseState.isDown = false;
	}

	onMouseMove(e: MouseEvent){
		this.mouseState.currentPosition = vec2.fromValues(e.offsetX * this.pixelRatio, e.offsetY * this.pixelRatio);
		let delta = vec2.sub(vec2.create(), this.mouseState.currentPosition, this.mouseState.startPosition);
		
		if(this.activeGrabingArea){
			this.activeGrabingArea.move(delta);
			this.onChange();
		}

		if(this.mouseState.isDown){
			this.pan(delta);
			this.onChange();
		}
		this.mouseState.startPosition = this.mouseState.currentPosition;
	}

	onMouseWheel(e: WheelEvent){
		e.preventDefault();
		if(e.ctrlKey){
			this.zoomTouch(-e.deltaY/50, vec2.fromValues(e.offsetX * this.pixelRatio, e.offsetY * this.pixelRatio));
		}
		else{
			var delta = Math.max(-1, Math.min(1, (e.deltaY || -e.detail)));
			if(delta == 0) return;
			this.zoomMouse(delta, vec2.fromValues(e.offsetX * this.pixelRatio, e.offsetY * this.pixelRatio));
		}

		this.onChange();
	}

	onTouchStart(e: TouchEvent){
		e.preventDefault();
		console.log(e.touches[0])
		if(e.touches.length == 1){
			this.mouseState.isDown = true;
			this.mouseState.startPosition = this.clientToCanvasPoint(
				vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY));
		}
		else if(e.touches.length == 2){
			this.mouseState.isDown = true;
			this.mouseState.startPosition = this.clientToCanvasPoint(vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY));
			this.mouseState.startPosition2 = this.clientToCanvasPoint(vec2.fromValues(e.touches[1].clientX, e.touches[1].clientY));
		}
		console.log('down', this.mouseState.startPosition, this.mouseState.startPosition2, this.container)
	}
	onTouchMove(e: TouchEvent){
		if(e.touches.length == 1){
			this.mouseState.currentPosition = this.clientToCanvasPoint(vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY));
			if(this.mouseState.isDown){
				let delta = vec2.sub(vec2.create(), this.mouseState.currentPosition, this.mouseState.startPosition);
				vec2.scale(delta, delta, 1);
				this.pan(delta);

				this.mouseState.startPosition = this.mouseState.currentPosition;
			}
		}
		else if(e.touches.length == 2){
			this.mouseState.currentPosition = this.clientToCanvasPoint(vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY));
			this.mouseState.currentPosition2 = this.clientToCanvasPoint(vec2.fromValues(e.touches[1].clientX, e.touches[1].clientY));

			if(this.mouseState.isDown){
				let startPositionCenter = vec2.add(vec2.create(), this.mouseState.startPosition, this.mouseState.startPosition2);
				vec2.scale(startPositionCenter, startPositionCenter, 0.5);

				let currentPositionCenter = vec2.add(vec2.create(), this.mouseState.currentPosition, this.mouseState.currentPosition2);
				vec2.scale(currentPositionCenter, currentPositionCenter, 0.5);

				let delta = vec2.sub(vec2.create(), currentPositionCenter, startPositionCenter);

				this.pan(delta);

				let startDelta = vec2.distance(this.mouseState.startPosition, this.mouseState.startPosition2);
				let currentDelta = vec2.distance(this.mouseState.currentPosition, this.mouseState.currentPosition2);
				let deltaZoom = (currentDelta - startDelta) / 200;

				let pos = vec2.add(vec2.create(), this.mouseState.currentPosition, this.mouseState.currentPosition2);
				vec2.scale(pos, pos, 0.5);
				this.zoomTouch(deltaZoom, pos);

				this.mouseState.startPosition = this.mouseState.currentPosition;
				this.mouseState.startPosition2 = this.mouseState.currentPosition2;
			}
		}

		this.onChange();
	}
	onTouchEnd(e: TouchEvent){
		this.mouseState.isDown = false;
	}

	clientToCanvasPoint(position: vec2){
		console.log(this.container.offsetLeft, this.container.offsetTop)
		let p = vec2.create()
		vec2.sub(p, position, vec2.fromValues(this.container.offsetLeft, this.container.offsetTop));
		vec2.scale(p, p, this.pixelRatio);
		return p;
	}

	// viewport navigation
	pan(delta: vec2){
		vec2.add(this.offset, this.offset, vec2.scale(vec2.create(), delta, 1/this.zoom));
		this.computeTransformations();
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

	computeTransformations(){
		let v = vec2.clone(this.offset);
		vec2.scale(v, v, this.zoom);
		mat3.fromTranslation(this.graphToCanvas, v);
		mat3.scale(this.graphToCanvas, this.graphToCanvas, vec2.fromValues(this.zoom, -this.zoom));
	}
}