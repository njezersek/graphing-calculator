import ImplicitFunctionTracer from "ImplicitFunctionTracer";
import { Vec } from "Math";
import Interval from "interval-arithmetic";
import { _Interval } from "interval-arithmetic/lib/interval";
let compile = require("interval-arithmetic-eval");


export default class IntervalQuadTreeTracer extends ImplicitFunctionTracer{

	vertices: Vec<2>[] = [];
	edges: [number, number, string, number][] = [];

	epsilon = 0.00001;

	MIN_DEPHT = 5;
	MAX_DEPTH = 11;

	DEBUG = true;

	counter = 0;
	startTime: number = 0;

	f: (context: {x: _Interval; y: _Interval}) => _Interval;

	constructor(){
		super();
		this.f = (p: {x: _Interval, y: _Interval}) => new Interval(1);

		this.setExpression("x^2 + y^2 + 3*sin(10*x^3) - 1")
	}

	setExpression(expression: string){
		let compiled = compile(expression);
		this.f = compiled.eval;
	}

	addEdge(p1: Vec<2>, p2: Vec<2>, color: string = "#ff0", width: number = 2){
		let i1 = this.vertices.push(p1) - 1;
		let i2 = this.vertices.push(p2) - 1;
		this.edges.push([i1, i2, color, width]);
	}

	trace(topLeft: Vec<2>, bottomRight: Vec<2>) : [Vec<2>[], [number, number, string, number][]] {
		this.vertices = [];
		this.edges = [];

		this.epsilon = Math.max(Math.abs(topLeft.x - bottomRight.x), Math.abs(topLeft.y - bottomRight.y)) * 0.00001;

		this.startTime = Date.now();
		this.counter = 0;

		this.traceRecursive(topLeft, bottomRight);

		let duration = Date.now() - this.startTime;
		// console.log(`Tracing took ${duration}ms; ${this.counter} calls; ${duration/this.counter}ms per call; ${1000/duration} FPS}`);

		return [this.vertices, this.edges];
	}


	traceRecursive(topLeft: Vec<2>, bottomRight: Vec<2>, depth: number = 0) {
		this.counter++;
		let topRight = Vec.values([bottomRight.x, topLeft.y]);
		let bottomLeft = Vec.values([topLeft.x, bottomRight.y]);
		let center = topLeft.add(bottomRight).div(2);
		let topCenter = Vec.values([center.x, topLeft.y]);
		let bottomCenter = Vec.values([center.x, bottomRight.y]);
		let leftCenter = Vec.values([topLeft.x, center.y]);
		let rightCenter = Vec.values([bottomRight.x, center.y]);
		
		let z1 = this.interpolation(topLeft, topRight);
		let z2 = this.interpolation(topRight, bottomRight);
		let z3 = this.interpolation(bottomRight, bottomLeft);
		let z4 = this.interpolation(bottomLeft, topLeft);

		let z = [z1, z2, z3, z4]
		let zeros = z.filter(z => z !== false && z !== true) as Vec<2>[];
		// let interestingDerivative = z.filter(z => z === true);

		// this.addEdge(topRight, topLeft, '#00a', 1);
		// this.addEdge(topLeft, bottomLeft, '#00a', 1);
		// this.addEdge(bottomLeft, bottomRight, '#00a', 1);
		// this.addEdge(bottomRight, topRight, '#00a', 1);

		if(depth >= this.MAX_DEPTH) { // max depth reached

			for(let i = 0; i < zeros.length; i++){
				for(let j = i + 1; j < zeros.length; j++){
					this.addEdge(zeros[i], zeros[j]);
				}
			}

			return;
		}
		let val = this.f({x: new Interval(topLeft.x, bottomRight.x), y: new Interval(bottomRight.y, topLeft.y)});
		if(!(val.lo <= 0 && val.hi >= 0)) return; // no zero in the interval


		this.traceRecursive(topLeft, center, depth + 1);
		this.traceRecursive(topCenter, rightCenter, depth + 1);
		this.traceRecursive(leftCenter, bottomCenter, depth + 1);
		this.traceRecursive(center, bottomRight, depth + 1);		


		// // leaf node
		// if(depth >= this.MAX_DEPTH || (zeros.length === 0 && depth >= this.MIN_DEPHT && interestingDerivative.length === 0)){
		// 	for(let i = 0; i < zeros.length; i++){
		// 		for(let j = i + 1; j < zeros.length; j++){
		// 			this.addEdge(zeros[i], zeros[j]);
		// 		}
		// 	}

		// 	if(this.DEBUG){
		// 		this.addEdge(topRight, topLeft, '#00a', 1);
		// 		this.addEdge(topLeft, bottomLeft, '#00a', 1);
		// 		this.addEdge(bottomLeft, bottomRight, '#00a', 1);
		// 		this.addEdge(bottomRight, topRight, '#00a', 1);
		// 	}

		// 	return;
		// }


		
	}

	// bisection(p1: Vec<2>, p2: Vec<2>): Vec<2> | false{
	// 	const maxIterations = 100;
		

	// 	let mid = p1.add(p2).div(2);
	// 	let f = this.f;

	// 	if(f(p1) * f(p2) > 0 ) return false;
	// 	for(let i=0; i<maxIterations; i++){
	// 		mid = p1.add(p2).div(2);

	// 		let fMid = f(mid);
	// 		if(Math.abs(fMid) < this.epsilon) return mid;

	// 		if(f(p1) * fMid  < 0) p2 = mid;
	// 		else p1 = mid;
	// 	}

	// 	return mid;
	// }

	interpolation(p1: Vec<2>, p2: Vec<2>): Vec<2> | false | true {
		let f1i = this.f({x: new Interval(p1.x), y: new Interval(p1.y)});
		let f2i = this.f({x: new Interval(p2.x), y: new Interval(p2.y)});
		let f1 = (f1i.lo + f1i.hi) / 2;
		let f2 = (f2i.lo + f2i.hi) / 2;
		if(f1*f2 <= 0){
			let t1 = Math.abs(f2)/(Math.abs(f2)+Math.abs(f1));
			let t2 = Math.abs(f1)/(Math.abs(f2)+Math.abs(f1));
			return p1.mul(t1).add(p2.mul(t2));
		}
		// else if((f1-fMid)*(f2-fMid) > 0){
		// 	return true;
		// }
		else return false;
	}
}
