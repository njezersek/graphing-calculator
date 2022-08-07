use inari_wasm::Interval;
use nalgebra::{Vector2};
use crate::expression_parser::*;

pub static mut TRACER: Tracer = Tracer{
	real_function: None,
	interval_function: None,
	valid_expression: false,
	max_depth: 10,
	result: TracerResult{
		vertices: Vec::new(),
		edges: Vec::new(),
	},
};

pub struct TracerResult{
	pub vertices: Vec<f32>,
	pub edges: Vec<u32>,
}

pub struct Tracer{
	pub interval_function: Option<F2di>,
	pub real_function: Option<F2df>,
	pub valid_expression: bool,
	pub max_depth: i8,
	pub result: TracerResult,
}

impl Tracer{
	pub fn set_expression(self: &mut Self, expression: String){
		match get_function(expression) {
			Some((ff, fi)) => {
				self.valid_expression = true;
				(self.real_function, self.interval_function) = (Some(ff), Some(fi))
			},
			None => {
				self.valid_expression = false;	
				return
			},
		}
	}

	pub fn compute(self: &mut Self, x: Interval, y: Interval) {
		self.result = TracerResult{
			vertices: Vec::new(),
			edges: Vec::new(),
		};
		self.compute_rec(x, y, 0);
	}

	fn compute_rec(self: &mut Self, x: Interval, y: Interval, depth: i8) {
		// if self.valid_expression == false {
		// 	return;
		// }
		let f = self.interval_function.as_ref().unwrap();
		
		// if maximum depth is reached, return
		if depth >= self.max_depth {
			self.add_rect(x, y);
			return;
		}



		// eval function on current rectangle defined by x and y
		let z = f(x, y);

		// if z.is_empty() {
		// 	self.add_rect(x, y);
		// 	return;
		// }

		if !z.contains(0.0) {
			return;
		}

		let w = (x.sup - x.inf) / 2.0;
		let h = (y.sup - y.inf) / 2.0;
		self.compute_rec(Interval{inf: x.inf, sup: x.sup - w}, Interval{inf: y.inf, sup: y.sup-h}, depth+1);
		self.compute_rec(Interval{inf: x.inf + w, sup: x.sup}, Interval{inf: y.inf, sup: y.sup-h}, depth+1);
		self.compute_rec(Interval{inf: x.inf, sup: x.sup - w}, Interval{inf: y.inf + h, sup: y.sup}, depth+1);
		self.compute_rec(Interval{inf: x.inf + w, sup: x.sup}, Interval{inf: y.inf + h, sup: y.sup}, depth+1);

		return;
	}

	fn add_rect(self: &mut Self, x: Interval, y: Interval){
		let top_left = Vector2::new(x.inf, y.sup);
		let top_right = Vector2::new(x.sup, y.sup);
		let bottom_left = Vector2::new(x.inf, y.inf);
		let bottom_right = Vector2::new(x.sup, y.inf);

		// self.add_edge(top_left, top_right);
		// self.add_edge(top_right, bottom_right);
		// self.add_edge(bottom_right, bottom_left);
		// self.add_edge(bottom_left, top_left);

		let zeros = vec![
			self.find_zero(top_left, top_right),
			self.find_zero(top_right, bottom_right),
			self.find_zero(bottom_right, bottom_left),
			self.find_zero(bottom_left, top_left),
		];

		let zeros_filtered: Vec<Vector2<f64>> = zeros.into_iter().flatten().collect();
		for i in 0..zeros_filtered.len() {
			for j in i..zeros_filtered.len() {
				self.add_edge(zeros_filtered[i], zeros_filtered[j]);
			}
		}
	}

	fn find_zero(self: &Self, p1: Vector2<f64>, p2: Vector2<f64>) -> Option<Vector2<f64>> {
		let f = self.real_function.as_ref().unwrap();

		let f1 = f(p1.x, p1.y);
		let f2 = f(p2.x, p2.y);
		if f1 * f2 <= 0.0 {
			let t1 = f2.abs() / (f1.abs() + f2.abs());
			let t2 = f1.abs() / (f1.abs() + f2.abs());
			return Some(p1 * t1 + p2 * t2);
		}
		return None;
	}

	fn add_edge(self: &mut Self, p1: Vector2<f64>, p2: Vector2<f64>){
		self.result.edges.push((self.result.vertices.len()/2) as u32);
		self.result.vertices.push(p1.x as f32);
		self.result.vertices.push(p1.y as f32);
		self.result.edges.push((self.result.vertices.len()/2) as u32);
		self.result.vertices.push(p2.x as f32);
		self.result.vertices.push(p2.y as f32);
	}
}