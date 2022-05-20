type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' |  'unshift'
type Tuple<T, L extends number, TObj = [T, ...Array<T>]> =
	Pick<TObj, Exclude<keyof TObj, ArrayLengthMutationKeys>>
	& {
		readonly length: L 
		[ I : number ] : T
		[Symbol.iterator]: () => IterableIterator<T>   
	}

export class Mat<M extends number, N extends number>{
	data: Tuple<Tuple<number, N>, M>;

	constructor(public m: M, public n: N){
		let data: number[][] = [];
		for(let i = 0; i < m; i++){
			data[i] = [];
			for(let j = 0; j < n; j++){
				data[i][j] = 0;
			}
		}

		this.data = data as unknown as Tuple<Tuple<number, N>, M>;
	}

	map(v: Mat<M, N>, func: (a: number, b: number) => number, inPlace = false){
		if(inPlace){
			for(let i = 0; i < this.m; i++){
				for(let j = 0; j < this.n; j++){
					this.data[i][j] = func(this.data[i][j], v.data[i][j]);
				}
			}
			return this;
		}
		else{
			let result = new Mat(this.m, this.n);
			for(let i = 0; i < this.m; i++){
				for(let j = 0; j < this.n; j++){
					result.data[i][j] = func(this.data[i][j], v.data[i][j]);
				}
			}
			return result;
		}
	}

	add(n: number, inPlace?: boolean) : Mat<M, N>;
	add(v: Mat<M, N>, inPlace?: boolean) : Mat<M, N>;
	add(nOrV: number | Mat<M, N>, inPlace = false){
		if(typeof nOrV === "number"){
			return this.map(this, (a) => a + nOrV, inPlace);
		}
		else{
			return this.map(nOrV, (a, b) => a + b, inPlace);
		}
	}

	sub(n: number, inPlace?: boolean): Mat<M, N>;
	sub(v: Mat<M, N>, inPlace?: boolean): Mat<M, N>;
	sub(nOrV: number | Mat<M, N>, inPlace = false){
		if(typeof nOrV === "number"){
			return this.map(this, (a) => a - nOrV, inPlace);
		}
		else{
			return this.map(nOrV, (a, b) => a - b, inPlace);
		}
	}

	neg(inPlace = false){
		return this.map(this, (a) => -a, inPlace);
	}

	mul(n: number, inPlace?: boolean) : Mat<M, N>;
	mul(v: Mat<M, N>, inPlace?: boolean) : Mat<M, N>;
	mul(nOrV: number | Mat<M, N>, inPlace = false){
		if(typeof nOrV === "number"){
			return this.map(this, (a) => a * nOrV, inPlace);
		}
		else{
			return this.map(nOrV, (a, b) => a * b, inPlace);
		}
	}


	div(n: number, inPlace?: boolean) : Mat<M, N>;
	div(v: Mat<M, N>, inPlace?: boolean) : Mat<M, N>;
	div(nOrV: number | Mat<M, N>, inPlace = false){
		if(typeof nOrV === "number"){
			return this.map(this, (a) => a / nOrV, inPlace);
		}
		else{
			return this.map(nOrV, (a, b) => a / b, inPlace);
		}
	}

	dot<O extends number>(m: Mat<N, O>): Mat<M, O>;
	dot(v: Vec<N>): Vec<M>;
	dot<O extends number>(mOrV: Mat<N, O> | Vec<N>){
		if(mOrV instanceof Mat){
			let result = new Mat(this.m, mOrV.n);
			for(let i = 0; i < this.m; i++){
				for(let j = 0; j < mOrV.n; j++){
					let sum = 0;
					for(let k = 0; k < this.n; k++){
						sum += this.data[i][k] * mOrV.data[k][j];
					}
					result.data[i][j] = sum;
				}
			}
			return result;
		}
		else{
			let result = new Vec(this.m);
			for(let i = 0; i < this.m; i++){
				let sum = 0;
				for(let j = 0; j < this.n; j++){
					sum += this.data[i][j] * mOrV.data[j];
				}
				result.data[i] = sum;
			}
			return result;
		}
	}

	norm(){
		let sum = 0;
		for(let i = 0; i < this.m; i++){
			for(let j = 0; j < this.n; j++){
				sum += this.data[i][j] * this.data[i][j];
			}
		}
		return Math.sqrt(sum);
	}

	transpose(){
		let result = new Mat(this.n, this.m);
		for(let i = 0; i < this.m; i++){
			for(let j = 0; j < this.n; j++){
				result.data[j][i] = this.data[i][j];
			}
		}
		return result;
	}

	copy(){
		let result = new Mat(this.m, this.n);
		for(let i = 0; i < this.m; i++){
			for(let j = 0; j < this.n; j++){
				result.data[i][j] = this.data[i][j];
			}
		}
		return result;
	}

	toString(){
		let result = "";
		for(let i = 0; i < this.m; i++){
			for(let j = 0; j < this.n; j++){
				result += this.data[i][j] + " ";
			}
			result += "\n";
		}
		return result;
	}

	static zeros<M extends number, N extends number>(m: M, n: N){
		return new Mat(m, n);
	}

	static ones<M extends number, N extends number>(m: M, n: N){
		let mat = new Mat(m, n);
		for(let i = 0; i < m; i++){
			for(let j = 0; j < n; j++){
				mat.data[i][j] = 1;
			}
		}
		return mat;
	}

	static values<M extends number, N extends number>(data: Tuple<Tuple<number, N>, M>) : Mat<M,N> {
		let result = new Mat(data.length, data[0].length);
		for(let i = 0; i < data.length; i++){
			for(let j = 0; j < data[i].length; j++){
				result.data[i][j] = data[i][j];
			}
		}
		return result;		
	}

	static fromMat<M extends number, N extends number>(m: Mat<M, N>) : Mat<M, N> {
		let result = new Mat(m.m, m.n);
		for(let i = 0; i < m.m; i++){
			for(let j = 0; j < m.n; j++){
				result.data[i][j] = m.data[i][j];
			}
		}
		return result;
	}

	static fromCols<M extends number, N extends number>(v: Tuple<Vec<M>, N>) : Mat<M, N> {
		let result = new Mat(v[0].m, v.length);
		for(let i = 0; i < v[i].m; i++){
			for(let j = 0; j < v.length; j++){
				result.data[i][j] = v[j].data[i];
			}
		}
		return result;
	}

	static fromRows<M extends number, N extends number>(v: Tuple<Vec<N>, M>) : Mat<M, N> {
		let result = new Mat(v.length, v[0].m);
		for(let i = 0; i < v.length; i++){
			for(let j = 0; j < v[i].m; j++){
				result.data[i][j] = v[i].data[j];
			}
		}
		return result;
	}
}

export class Vec<M extends number>{
	data: Tuple<number, M>;

	constructor(public m: M){
		let data: number[] = [];
		for(let i = 0; i < m; i++){
			data[i] = 0;
		}

		this.data = data as unknown as Tuple<number, M>;
	}

	map(v: Vec<M>, func: (a: number, b: number) => number, inPlace = false){
		if(inPlace){
			for(let i = 0; i < this.m; i++){
				this.data[i] = func(this.data[i], v.data[i]);
			}
			return this;
		}
		else{
			let result = new Vec(this.m);
			for(let i = 0; i < this.m; i++){
				result.data[i] = func(this.data[i], v.data[i]);
			}
			return result;
		}
	}

	add(n: number, inPlace?: boolean) : Vec<M>;
	add(v: Vec<M>, inPlace?: boolean) : Vec<M>;
	add(nOrV: number | Vec<M>, inPlace = false){
		if(typeof nOrV === "number"){
			return this.map(this, (a) => a + nOrV, inPlace);
		}
		else{
			return this.map(nOrV, (a, b) => a + b, inPlace);
		}
	}

	sub(n: number, inPlace?: boolean): Vec<M>;
	sub(v: Vec<M>, inPlace?: boolean): Vec<M>;
	sub(nOrV: number | Vec<M>, inPlace = false){
		if(typeof nOrV === "number"){
			return this.map(this, (a) => a - nOrV, inPlace);
		}
		else{
			return this.map(nOrV, (a, b) => a - b, inPlace);
		}
	}

	neg(inPlace?: boolean){
		return this.map(this, (a) => -a, inPlace);
	}

	mul(n: number, inPlace?: boolean) : Vec<M>;
	mul(v: Vec<M>, inPlace?: boolean) : Vec<M>;
	mul(nOrV: number | Vec<M>, inPlace = false){
		if(typeof nOrV === "number"){
			return this.map(this, (a) => a * nOrV, inPlace);
		}
		else{
			return this.map(nOrV, (a, b) => a * b, inPlace);
		}
	}

	div(n: number, inPlace?: boolean) : Vec<M>;
	div(v: Vec<M>, inPlace?: boolean) : Vec<M>;
	div(nOrV: number | Vec<M>, inPlace = false){
		if(typeof nOrV === "number"){
			return this.map(this, (a) => a / nOrV, inPlace);
		}
		else{
			return this.map(nOrV, (a, b) => a / b, inPlace);
		}
	}

	dot(v: Vec<M>): number;
	dot<O extends number>(m: Mat<M, O>): Vec<O>;
	dot(vOrM: Vec<M> | Mat<M, M>){
		if(vOrM instanceof Vec){
			let result = 0;
			for(let i = 0; i < this.m; i++){
				result += this.data[i] * vOrM.data[i];
			}
			return result;
		}
		else{
			let result = new Vec(vOrM.n);
			for(let i = 0; i < vOrM.n; i++){
				for(let j = 0; j < this.m; j++){
					result.data[i] += this.data[j] * vOrM.data[j][i];
				}
			}
			return result;
		}
	}

	norm(){
		let sum = 0;
		for(let i = 0; i < this.m; i++){
			sum += this.data[i] * this.data[i];
		}
		return Math.sqrt(sum);
	}

	toMat(){
		let result = new Mat(this.m, 1);
		for(let i = 0; i < this.m; i++){
			result.data[i][0] = this.data[i];
		}
		return result;
	}

	copy(){
		let result = new Vec(this.m);
		for(let i = 0; i < this.m; i++){
			result.data[i] = this.data[i];
		}
		return result;
	}

	toString(){
		let result = "";
		for(let i = 0; i < this.m; i++){
			result += this.data[i] + " ";
		}
		return result;
	}

	static values<M extends number>(data: Tuple<number, M>){
		let result = new Vec(data.length);
		for(let i = 0; i < data.length; i++){
			result.data[i] = data[i];
		}
		return result;
	}

	static zeros<M extends number>(m: M){
		return new Vec(m);
	}

	static ones<M extends number>(m: M){
		let result = new Vec(m);
		for(let i = 0; i < m; i++){
			result.data[i] = 1;
		}
		return result;
	}

	static fromMat<M extends number>(m: Mat<M, 1>): Vec<M>;
	static fromMat<M extends number>(m: Mat<1, M>): Vec<M>;
	static fromMat<M extends number>(m: Mat<M, 1> | Mat<1, M>){
		if(m.n === 1){
			let result = new Vec(m.m);
			for(let i = 0; i < m.m; i++){
				result.data[i] = m.data[i][0];
			}
			return result;
		}
		else{
			let result = new Vec(m.n);
			for(let i = 0; i < m.n; i++){
				result.data[i] = m.data[0][i];
			}
			return result;
		}
	}
}