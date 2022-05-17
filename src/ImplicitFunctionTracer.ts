export type Point = [number, number]
export type Rect = [number, number, number, number]

export default abstract class ImplicitFunctionTracer{
	viewport: Rect;
	f: (p: Point) => number;

	constructor(f: (p: Point) => number, viewport: Rect){
		this.f = f;
		this.viewport = viewport;
	}

	abstract trace(): [vertices: Point[], edges: Point[]];
}
