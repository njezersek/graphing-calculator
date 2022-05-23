import ImplicitFunctionTracer from "ImplicitFunctionTracer";
import { Vec } from "Math";

export default class QuadTreeBisectionTracer extends ImplicitFunctionTracer{

	vertices: Vec<2>[] = [];
	edges: [number, number, string, number][] = [];

	epsilon = 0.00001;

	MIN_DEPHT = 4;
	MAX_DEPTH = 7;

	DEBUG = true;

	addEdge(p1: Vec<2>, p2: Vec<2>, color: string = "#ff0", width: number = 2){
		let i1 = this.vertices.push(p1) - 1;
		let i2 = this.vertices.push(p2) - 1;
		this.edges.push([i1, i2, color, width]);
	}

	trace(topLeft: Vec<2>, bottomRight: Vec<2>) : [Vec<2>[], [number, number, string, number][]] {
		this.vertices = [];
		this.edges = [];

		this.epsilon = Math.max(Math.abs(topLeft.x - bottomRight.x), Math.abs(topLeft.y - bottomRight.y)) * 0.00001;

		this.traceRecursive(topLeft, bottomRight, 0);

		return [this.vertices, this.edges];
	}

	traceRecursive(topLeft: Vec<2>, bottomRight: Vec<2>, depth: number) {
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

		let z = [z1, z2, z3, z4].filter(z => z !== false) as Vec<2>[];

		if(depth >= this.MAX_DEPTH || (z.length === 0 && depth >= this.MIN_DEPHT)){
			for(let i = 0; i < z.length; i++){
				for(let j = i + 1; j < z.length; j++){
					this.addEdge(z[i], z[j]);
				}
			}

			if(this.DEBUG){
				this.addEdge(topRight, topLeft, '#00a', 1);
				this.addEdge(topLeft, bottomLeft, '#00a', 1);
				this.addEdge(bottomLeft, bottomRight, '#00a', 1);
				this.addEdge(bottomRight, topRight, '#00a', 1);
			}

			return;
		}


		this.traceRecursive(topLeft, center, depth + 1);
		this.traceRecursive(topCenter, rightCenter, depth + 1);
		this.traceRecursive(leftCenter, bottomCenter, depth + 1);
		this.traceRecursive(center, bottomRight, depth + 1);		
	}

	bisection(p1: Vec<2>, p2: Vec<2>): Vec<2> | false{
		const maxIterations = 100;
		

		let mid = p1.add(p2).div(2);
		let f = this.f;

		if(f(p1) * f(p2) > 0 ) return false;
		for(let i=0; i<maxIterations; i++){
			mid = p1.add(p2).div(2);

			let fMid = f(mid);
			if(Math.abs(fMid) < this.epsilon) return mid;

			if(f(p1) * fMid  < 0) p2 = mid;
			else p1 = mid;
		}

		return mid;
	}

	interpolation(p1: Vec<2>, p2: Vec<2>): Vec<2> | false {
		let f1 = this.f(p1);
		let f2 = this.f(p2);
		if(f1*f2 <= 0){
			let t1 = Math.abs(f2)/(Math.abs(f2)+Math.abs(f1));
			let t2 = Math.abs(f1)/(Math.abs(f2)+Math.abs(f1));
			return p1.mul(t1).add(p2.mul(t2));
		}
		else return false;
	}
}
