import ImplicitFunctionTracer from "ImplicitFunctionTracer";
import { Vec } from "Math";

export default class QuadTreeTracer extends ImplicitFunctionTracer{

	vertices: Vec<2>[] = [];
	edges: [number, number, string, number][] = [];

	epsilon = 0.00001;

	MIN_DEPHT = 5;
	MAX_DEPTH = 9;

	DEBUG = false;

	addEdge(p1: Vec<2>, p2: Vec<2>, color: string = "#ff0", width: number = 2){
		let i1 = this.vertices.push(p1) - 1;
		let i2 = this.vertices.push(p2) - 1;
		this.edges.push([i1, i2, color, width]);
	}

	trace(topLeft: Vec<2>, bottomRight: Vec<2>) : [Vec<2>[], [number, number, string, number][]] {
		this.vertices = [];
		this.edges = [];

		this.epsilon = Math.max(Math.abs(topLeft.x - bottomRight.x), Math.abs(topLeft.y - bottomRight.y)) * 0.00001;

		this.traceRecursive(topLeft, bottomRight);

		return [this.vertices, this.edges];
	}

	traceIterative(topLeft: Vec<2>, bottomRight: Vec<2>){
		let n = 2**this.MIN_DEPHT;
		let d = bottomRight.sub(topLeft).div(n);
		for(let i=0; i<n; i++){
			for(let j=0; j<n; j++){
				let p1 = topLeft.add(d.mul(Vec.values([i, j])));
				let p2 = topLeft.add(d.mul(Vec.values([i+1, j])));
				let p3 = topLeft.add(d.mul(Vec.values([i+1, j+1])));
				let p4 = topLeft.add(d.mul(Vec.values([i, j+1])));
				if(this.DEBUG){
					this.addEdge(p1, p2, '#f00', 1);
					this.addEdge(p2, p3, '#f00', 1);
					this.addEdge(p3, p4, '#f00', 1);
					this.addEdge(p4, p1, '#f00', 1);
				}

				let z1 = this.interpolation(p1, p2);
				let z2 = this.interpolation(p2, p3);
				let z3 = this.interpolation(p3, p4);
				let z4 = this.interpolation(p4, p1);

				let z = [z1, z2, z3, z4].filter(z => z !== false) as Vec<2>[];
				for(let i = 0; i < z.length; i++){
					for(let j = i + 1; j < z.length; j++){
						this.addEdge(z[i], z[j]);
					}
				}
			}
		}
	}

	traceRecursive(topLeft: Vec<2>, bottomRight: Vec<2>, depth: number = 0) {
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
		let interestingDerivative = z.filter(z => z === true);

		// leaf node
		if(depth >= this.MAX_DEPTH || (zeros.length === 0 && depth >= this.MIN_DEPHT && interestingDerivative.length === 0)){
			for(let i = 0; i < zeros.length; i++){
				for(let j = i + 1; j < zeros.length; j++){
					this.addEdge(zeros[i], zeros[j]);
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

	interpolation(p1: Vec<2>, p2: Vec<2>): Vec<2> | false | true {
		let f1 = this.f(p1);
		let f2 = this.f(p2);
		let fMid = this.f(p1.add(p2).div(2));
		if(f1*f2 <= 0){
			let t1 = Math.abs(f2)/(Math.abs(f2)+Math.abs(f1));
			let t2 = Math.abs(f1)/(Math.abs(f2)+Math.abs(f1));
			return p1.mul(t1).add(p2.mul(t2));
		}
		else if((f1-fMid)*(f2-fMid) > 0){
			return true;
		}
		else return false;
	}
}
