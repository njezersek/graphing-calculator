// import ImplicitFunctionTracer from "ImplicitFunctionTracer";
// import { Vec } from "Math";

// export default class QuadTreeBisectionTracer extends ImplicitFunctionTracer{

// 	vertices: Vec<2>[] = [];
// 	edges: [number, number, string, number][] = [];

// 	epsilon = 0.00001;

// 	addEdge(p1: Vec<2>, p2: Vec<2>){
// 		let i1 = this.vertices.push(p1) - 1;
// 		let i2 = this.vertices.push(p2) - 1;
// 		this.edges.push([i1, i2, '#fff', 1]);
// 	}

// 	trace(topLeft: Vec<2>, bottomRight: Vec<2>): [Vec<2>[], [number, number, string, number][]] {
// 		this.vertices = [];
// 		this.edges = [];

// 		this.epsilon = Math.max(Math.abs(topLeft.x - bottomRight.x), Math.abs(topLeft.y - bottomRight.y)) * 0.00001;

// 		this.traceRecursive(topLeft, bottomRight, 6);

// 		return [this.vertices, this.edges];
// 	}

// 	traceRecursive(topLeft: Vec<2>, bottomRight: Vec<2>, depth: number) {
// 		let topRight = Vec.values([bottomRight.x, topLeft.y]);
// 		let bottomLeft = Vec.values([topLeft.x, bottomRight.y]);
// 		let center = topLeft.add(bottomRight).div(2);
// 		let topCenter = Vec.values([center.x, topLeft.y]);
// 		let bottomCenter = Vec.values([center.x, bottomRight.y]);
// 		let leftCenter = Vec.values([topLeft.x, center.y]);
// 		let rightCenter = Vec.values([bottomRight.x, center.y]);
		
// 		let z1 = this.newton(topLeft, topRight);
// 		let z2 = this.newton(topRight, bottomRight);
// 		let z3 = this.newton(bottomRight, bottomLeft);
// 		let z4 = this.newton(bottomLeft, topLeft);

// 		let z = [z1, z2, z3, z4].filter(z => z !== false) as Vec<2>[];

// 		if(depth <= 0 || (z.length === 0 && depth <= 6)){
// 			for(let i = 0; i < z.length; i++){
// 				for(let j = i + 1; j < z.length; j++){
// 					this.addEdge(z[i], z[j]);
// 				}
// 			}
// 			return;
// 		}


// 		this.traceRecursive(topLeft, center, depth - 1);
// 		this.traceRecursive(topCenter, rightCenter, depth - 1);
// 		this.traceRecursive(leftCenter, bottomCenter, depth - 1);
// 		this.traceRecursive(center, bottomRight, depth - 1);		
// 	}

// 	newton(p1: Vec<2>, p2: Vec<2>): Vec<2> | false{
// 		const maxIterations = 100;

// 		let x = 0.5;
// 		let f = (x: number) => this.f(p1.mul(x).add(p2.mul(1 - x)));
// 		let df = (x: number) => (f(x + this.epsilon) - f(x))/this.epsilon;

// 		for(let i=0; i<maxIterations; i++){
// 			let fx = f(x);
// 			x = x - fx / df(x);

// 			if(Math.abs(fx) < this.epsilon) {
// 				if(x < 0 || x > 1) return false;
// 				return p1.mul(x).add(p2.mul(1 - x));
// 			};
// 		}

// 		return false;

// 	}
// }
