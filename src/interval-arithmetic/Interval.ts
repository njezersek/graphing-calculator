export type nInterval = [number, number];
export type ReadonlyInterval = readonly [number, number];

export module nInterval {
	export function create(): nInterval {
		return [0, 0];
	}

	export function fromValues(lo: number, hi: number): nInterval {
		return [lo, hi];
	}

	export function clone(interval: ReadonlyInterval): nInterval {
		return [interval[0], interval[1]];
	}

	export function isEmpty(interval: ReadonlyInterval): boolean {
		return interval[0] === interval[1];
	}

	export function isFiniteInterval(interval: ReadonlyInterval): boolean {
		return isFinite(interval[0]) && isFinite(interval[1]);
	}

	export function contains(interval: ReadonlyInterval, value: number): boolean {
		return interval[0] <= value && value <= interval[1];
	}

	// basic operations
	export function add(out: nInterval, a: ReadonlyInterval, b: number): nInterval;
	export function add(out: nInterval, a: number, b: ReadonlyInterval): nInterval;
	export function add(out: nInterval, a: ReadonlyInterval, b: ReadonlyInterval): nInterval;
	export function add(out: nInterval, a: ReadonlyInterval | number, b: ReadonlyInterval | number): nInterval {
		if(typeof a === 'number' && typeof b !== 'number') {
			out[0] = b[0] + a;
			out[1] = b[1] + a;
			return out;
		}
		else if(typeof b === 'number' && typeof a !== 'number') {
			out[0] = a[0] + b;
			out[1] = a[1] + b;
			return out;
		}
		else if(typeof a !== 'number' && typeof b !== 'number') {
			out[0] = a[0] + b[0];
			out[1] = a[1] + b[1];
			return out;
		}
		return out;
	}

	export function sub(out: nInterval, a: ReadonlyInterval, b: ReadonlyInterval): nInterval {
		out[0] = a[0] - b[1];
		out[1] = a[1] - b[0];
		return out;
	}
	export function mul(out: nInterval, a: ReadonlyInterval, b: number): nInterval;
	export function mul(out: nInterval, a: number, b: ReadonlyInterval): nInterval;
	export function mul(out: nInterval, a: ReadonlyInterval, b: ReadonlyInterval): nInterval;
	export function mul(out: nInterval, a: ReadonlyInterval | number, b: ReadonlyInterval | number): nInterval {
		if(typeof a === 'number' && typeof b !== 'number') {
			if(a > 0){
				out[0] = b[0] * a;
				out[1] = b[1] * a;
			}
			else{
				out[0] = b[1] * a;
				out[1] = b[0] * a;
			}
			return out;
		}
		else if(typeof b === 'number' && typeof a !== 'number') {
			if(b > 0){
				out[0] = a[0] * b;
				out[1] = a[1] * b;
			}
			else{
				out[0] = a[1] * b;
				out[1] = a[0] * b;
			}
			return out;
		}
		else if(typeof a !== 'number' && typeof b !== 'number'){	
			let a0b0 = a[0] * b[0];
			let a0b1 = a[0] * b[1];
			let a1b0 = a[1] * b[0];
			let a1b1 = a[1] * b[1];
			out[0] = Math.min(a0b0, a0b1, a1b0, a1b1);
			out[1] = Math.max(a0b0, a0b1, a1b0, a1b1);
			return out;
		}
		return out;
	}

	export function reciprocal(out: nInterval, a: ReadonlyInterval): nInterval {
		out[0] = 1 / a[1];
		out[1] = 1 / a[0];
		if(a[0] === 0){
			out[1] = +Infinity;
		}
		if(a[1] === 0){
			out[0] = -Infinity;
		}
		if(contains(a, 0)) {
			out[0] = -Infinity;
			out[1] = +Infinity;
		}
		return out;
	}

	export function div(out: nInterval, a: ReadonlyInterval, b: ReadonlyInterval): nInterval {
		return mul(out, a, reciprocal(create(), b));
	}

	export function ln(out: nInterval, a: ReadonlyInterval): nInterval {
		out[0] = Math.log(Math.max(a[0], 0));
		out[1] = Math.log(Math.max(a[1], 0));

		if(a[1] < 0){
			out[0] = NaN;
			out[1] = NaN;
		}
		return out;
	}

	export function exp(out: nInterval, a: ReadonlyInterval): nInterval {
		out[0] = Math.exp(a[0]);
		out[1] = Math.exp(a[1]);
		return out;
	}

	// export function pow(out: Interval, a: ReadonlyInterval, b: ReadonlyInterval): Interval {
	// 	if(b[0] >= 0){
	// 		return exp(out, mul(create(), b, ln(create(), a)));
	// 	}

	// }

	export function powi(out: nInterval, a: ReadonlyInterval, n: number): nInterval {
		if(Number.isInteger(n)){
			if(n === 0){
				out[0] = 1;
				out[1] = 1;
				return out;
			}
			else if(n > 0){
				if(n % 2 === 1){
					out[0] = a[0] ** n;
					out[1] = a[1] ** n;
					return out;
				}
				else{
					out[0] = Math.max(0, Math.min(a[0] ** n, a[1] ** n, a[0] * a[1]));
					out[1] = Math.max(a[0] ** n, a[1] ** n);
					return out;
				}
			}
			else if(n < 0){
				let ra = reciprocal(create(), a);
				powi(out, ra, -n);
				return out;
			}
		}
		else{ // n is real
			if(n == 0){
				out[0] = 1;
				out[1] = 1;
				return out;
			}
			else if(n > 0){
				out[0] = Math.max(a[0], 0) ** n;
				out[1] = Math.max(a[1], 0) ** n;

				if(a[1] < 0){ // interval a does not contain defined values
					out[0] = NaN;
					out[1] = NaN;
				}

				return out;
			}
			else if(n < 0){
				let ra = reciprocal(create(), a);
				powi(out, ra, -n);
				return out;
			}
		}
		return out;
	}

	export function cos(out: nInterval, a: ReadonlyInterval): nInterval {
		let lo = a[0] / Math.PI;
		let hi = a[1] / Math.PI;

		if(hi - lo >= 2){
			out[0] = -1;
			out[1] = 1;
			return out;
		}

		if(Math.floor(lo)%2 == 0 && Math.floor(hi)%2 == 0){ // both ends in monothonic descending section
			out[0] = Math.cos(a[1]);
			out[1] = Math.cos(a[0]);
			return out;
		}
		if(Math.floor(lo)%2 == 1 && Math.floor(hi)%2 == 1){ // both ends in monothonic ascending section
			out[0] = Math.cos(a[0]);
			out[1] = Math.cos(a[1]);
			return out;
		}
		if(Math.floor(lo)%2 == 0 && Math.floor(hi)%2 == 1){ // left end in monothonic descending section, right end in monothonic ascending section
			out[0] = -1;
			out[1] = Math.max(Math.cos(a[0]), Math.cos(a[1]));
			return out;
		}
		if(Math.floor(lo)%2 == 1 && Math.floor(hi)%2 == 0){ // left end in monothonic ascending section, right end in monothonic descending section
			out[0] = Math.min(Math.cos(a[0]), Math.cos(a[1]));
			out[1] = 1;
			return out;
		}

		return out;
	}

	export function sin(out: nInterval, a: ReadonlyInterval): nInterval {
		return cos(out, add(create(), a, Math.PI/2));
	}

}