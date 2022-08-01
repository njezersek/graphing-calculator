export default class cInterval {
	lo = 0;
	hi = 0;

	constructor(lo: number, hi: number);
	constructor(interval: cInterval);
	constructor();
	constructor(loOrInterval?: number | cInterval, hi?: number){
		if(loOrInterval !== undefined){
			if(typeof loOrInterval === 'number' && typeof hi === 'number'){
				this.lo = loOrInterval;
				this.hi = hi;
			}
			else if(typeof loOrInterval !== 'number' && hi === undefined){
				this.lo = loOrInterval.lo;
				this.hi = loOrInterval.hi;
			}
		}
	}

	contains(n: number){
		return n >= this.lo && n <= this.hi;
	}

	add(b: number): cInterval;
	add(b: cInterval): cInterval;
	add(b: number | cInterval): cInterval {
		if(typeof b === 'number'){
			return new cInterval(this.lo + b, this.hi + b);
		}
		else{
			return new cInterval(this.lo + b.lo, this.hi + b.hi);
		}
	}

	sub(b: cInterval): cInterval;
	sub(b: number): cInterval;
	sub(b: number | cInterval): cInterval {
		if(typeof b === 'number'){
			return new cInterval(this.lo - b, this.hi - b);
		}
		else{
			return new cInterval(this.lo - b.hi, this.hi - b.lo);
		}
	}

	mul(b: number): cInterval;
	mul(b: cInterval): cInterval;
	mul(b: number | cInterval): cInterval {
		if(typeof b === 'number'){
			return new cInterval(this.lo * b, this.hi * b);
		}
		else{
			return new cInterval(
				Math.min(this.lo * b.lo, this.lo * b.hi, this.hi * b.lo, this.hi * b.hi),
				Math.max(this.lo * b.lo, this.lo * b.hi, this.hi * b.lo, this.hi * b.hi)
			);
		}
	}

	reciprocal(): cInterval {
		let out = new cInterval(1 / this.hi, 1 / this.lo);
		if(this.lo === 0){
			out.hi = +Infinity;
		}
		if(this.hi === 0){
			out.lo = -Infinity;
		}
		if(this.contains(0)) {
			out.lo = -Infinity;
			out.hi = +Infinity;
		}
		return out;
	}

	div(b: number): cInterval;
	div(b: cInterval): cInterval;
	div(b: number | cInterval): cInterval {
		if(typeof b === 'number'){
			return new cInterval(this.lo / b, this.hi / b);
		}
		else{
			let b_reciprocal = b.reciprocal();
			return new cInterval(
				Math.min(this.lo * b_reciprocal.hi, this.lo * b_reciprocal.lo, this.hi * b_reciprocal.hi, this.hi * b_reciprocal.lo),
				Math.max(this.lo * b_reciprocal.hi, this.lo * b_reciprocal.lo, this.hi * b_reciprocal.hi, this.hi * b_reciprocal.lo)
			);
		}
	}

	ln(): cInterval {
		let out = new cInterval(Math.log(Math.max(this.lo, 0)), Math.log(Math.max(this.hi, 0)));

		if(this.hi < 0){
			out.lo = NaN;
			out.hi = NaN;
		}
		return out;
	}

	exp(): cInterval {
		return new cInterval(Math.exp(this.lo), Math.exp(this.hi));
	}

	powi(n: number): cInterval {
		if(n === 0){
			return new cInterval(1, 1);
		}
		if(Number.isInteger(n)){
			if(n > 0){
				if(n % 2 === 1){
					return new cInterval(this.lo ** n, this.hi ** n);
				}
				else{
					return new cInterval(
						Math.max(0, Math.min(this.lo ** n, this.hi ** n, this.lo * this.hi)),
						Math.max(this.lo ** n, this.hi ** n)
					);
				}
			}
			else{ // n < 0
				return this.reciprocal().powi(-n);
			}
		}
		else{ // n is real
			if(n > 0){
				let out = new cInterval(
					Math.max(0, this.lo) ** n,
					Math.max(0, this.hi) ** n
				);

				if(this.hi < 0){ // interval a does not contain defined values
					out.lo = NaN;
					out.hi = NaN;
				}

				return out;
			}
			else{ // n < 0
				return this.reciprocal().powi(-n);
			}
		}
	}

	cos(): cInterval {
		let lo_n = this.lo / Math.PI;
		let hi_n = this.hi / Math.PI;

		if(hi_n - lo_n >= 2){
			return new cInterval(-1, 1);
		}

		if(Math.floor(lo_n)%2 == 0 && Math.floor(hi_n)%2 == 0){ // both ends in monothonic descending section
			return new cInterval(Math.cos(this.hi), Math.cos(this.lo));
		}
		else if(Math.floor(lo_n)%2 == 1 && Math.floor(hi_n)%2 == 1){ // both ends in monothonic ascending section
			return new cInterval(Math.cos(this.lo), Math.cos(this.hi));
		}
		else if(Math.floor(lo_n)%2 == 0 && Math.floor(hi_n)%2 == 1){ // left end in monothonic descending section, right end in monothonic ascending section
			return new cInterval(-1, Math.max(Math.cos(this.lo), Math.cos(this.hi)));
		}
		else{ // left end in monothonic ascending section, right end in monothonic descending section
			return new cInterval(Math.min(Math.cos(this.lo), Math.cos(this.hi)), 1);
		}
	}

	sin(): cInterval {
		return this.add(Math.PI / 2).cos();
	}

	tan(): cInterval {
		let out = new cInterval(Math.tan(this.hi), Math.tan(this.lo));
		// if((this.lo % Math.PI + Math.PI) % Math.PI )
		return out;
	}

	static cos(a: cInterval): cInterval {
		return a.cos();
	}

	static sin(a: cInterval): cInterval {
		return a.sin();
	}
}