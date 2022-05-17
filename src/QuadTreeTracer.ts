import ImplicitFunctionTracer, {Point, Rect} from "ImplicitFunctionTracer";


export default class QuadTreeTracer extends ImplicitFunctionTracer{
	trace(): [vertices: Point[], edges: Point[]] {
		let vertices: Point[] = [[0,0], [1,0], [1,1], [0,1]];
		let edges: Point[] = [[0,1], [1,2], [2,3], [3,0]];

		return [vertices, edges];
	}
}
