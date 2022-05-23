import { Vec } from "Math";
export default abstract class ImplicitFunctionTracer{
	f: (p: Vec<2>) => number;

	constructor(f: (p: Vec<2>) => number){
		this.f = f;
	}

	abstract trace(topLeft: Vec<2>, bottomRight: Vec<2>): [Vec<2>[], [number, number, string, number][]];
}
