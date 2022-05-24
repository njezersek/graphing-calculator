import { Vec } from "Math";
export default abstract class ImplicitFunctionTracer{
	f: (p: Vec<2>) => number;

	constructor(){
		this.f = (p: Vec<2>) => 1;
	}

	setExpression(expression: string){
		let e = new Function("x", "y", "return " + expression) as (x: number, y: number) => number;
		this.f = (p: Vec<2>) => e(p.x, p.y);
	}

	abstract trace(topLeft: Vec<2>, bottomRight: Vec<2>): [Vec<2>[], [number, number, string, number][]];
}
