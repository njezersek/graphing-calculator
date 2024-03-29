use inari_wasm::Interval;
use nalgebra::{Vector2};
use strum_macros::EnumString;
use crate::expression_parser::*;

pub struct TracerResult{
	pub vertices: Vec<f32>,
	pub edges: Vec<u32>,
	pub vertices_debug: Vec<f32>,
	pub edges_debug: Vec<u32>,
}

#[derive(EnumString)]
pub enum ZeroFindingAlgorithm{
	RegulaFalsi,
	Bisection,
	Newton,
	Interpolation,
	Middle,
}

#[derive(EnumString)]
pub enum ZeroExclusionAlgorithm {
	SignIntervalCombo,
	IntervalAritmetic,
	SignDifference,
	Disabled,
}

pub struct Tracer{
	pub interval_function: Option<F2di>,
	pub real_function: Option<F2df>,
	pub valid_expression: bool,
	pub max_depth: i8,
	pub result: TracerResult,
	pub zero_exclusion_algorithm: ZeroExclusionAlgorithm,
	pub zero_finding_algorithm: ZeroFindingAlgorithm,
	pub error: String,
	pub show_debug_tree: bool,
	pub show_debug_leaves: bool,
	pub x: Interval,
	pub y: Interval,
}

pub static mut TRACER: Tracer = Tracer{
	real_function: None,
	interval_function: None,
	valid_expression: false,
	error: String::new(),
	show_debug_tree: false,
	show_debug_leaves: false,
	max_depth: 12,
	zero_exclusion_algorithm: ZeroExclusionAlgorithm::IntervalAritmetic,
	zero_finding_algorithm: ZeroFindingAlgorithm::RegulaFalsi,
	result: TracerResult{
		vertices: Vec::new(),
		edges: Vec::new(),
		vertices_debug: Vec::new(),
		edges_debug: Vec::new(),
	},
	x: Interval{inf: -1.0, sup: 1.0},
	y: Interval{inf: -1.0, sup: 1.0},
};

impl Tracer{
	pub fn set_expression(self: &mut Self, expression: String){
		match get_function(expression) {
			Ok((ff, fi)) => {
				self.valid_expression = true;
				self.error = "".to_string();
				(self.real_function, self.interval_function) = (Some(ff), Some(fi))
			},
			Err(msg) => {
				self.valid_expression = false;
				self.error = msg;
			},
		}
	}

	pub fn compute(self: &mut Self) {
		self.result = TracerResult{
			vertices: Vec::new(),
			edges: Vec::new(),
			vertices_debug: Vec::new(),
			edges_debug: Vec::new(),
		};
		self.compute_rec(self.x, self.y, 0);
	}

	fn compute_rec(self: &mut Self, x: Interval, y: Interval, depth: i8) {
		if self.valid_expression == false {
			return;
		}
		
		if self.exclude_zero(x, y){
			if self.show_debug_tree { self.add_debug_rect(x, y) };
			return;
		}

		// if maximum depth is reached, return
		if depth >= self.max_depth {
			if self.show_debug_leaves { self.add_debug_rect(x, y) };
			self.add_rect(x, y);
			return;
		}
		

		let w = (x.sup - x.inf) / 2.0;
		let h = (y.sup - y.inf) / 2.0;
		self.compute_rec(Interval{inf: x.inf, sup: x.sup - w}, Interval{inf: y.inf, sup: y.sup-h}, depth+1);
		self.compute_rec(Interval{inf: x.inf + w, sup: x.sup}, Interval{inf: y.inf, sup: y.sup-h}, depth+1);
		self.compute_rec(Interval{inf: x.inf, sup: x.sup - w}, Interval{inf: y.inf + h, sup: y.sup}, depth+1);
		self.compute_rec(Interval{inf: x.inf + w, sup: x.sup}, Interval{inf: y.inf + h, sup: y.sup}, depth+1);

	}

	fn exclude_zero(self: &mut Self, x: Interval, y: Interval) -> bool {
		match self.zero_exclusion_algorithm {					
			ZeroExclusionAlgorithm::SignIntervalCombo => if !self.sign_difference_exclusion(x, y) { false } else { self.interval_arithmetic_exclusion(x, y) },
			ZeroExclusionAlgorithm::IntervalAritmetic => self.interval_arithmetic_exclusion(x, y),
			ZeroExclusionAlgorithm::SignDifference => self.sign_difference_exclusion(x, y),
			ZeroExclusionAlgorithm::Disabled => false,
		}
	}

	fn interval_arithmetic_exclusion(self: &mut Self, x: Interval, y: Interval) -> bool {
		let f = self.interval_function.as_ref().unwrap();
		let z = f(x, y);
		!z.contains(0.0)
	}

	fn sign_difference_exclusion(self: &mut Self, x: Interval, y: Interval) -> bool {
		let f = self.real_function.as_ref().unwrap();
		let infsup = f(x.inf, y.sup);
		let supinf = f(x.sup, y.inf);
		let supsup = f(x.sup, y.sup);
		let infinf = f(x.inf, y.inf);

		return infsup * supsup > 0.0 && 
			infinf * supsup > 0.0 && 
			infinf * infsup > 0.0 &&
			supinf * supsup > 0.0
	}

	fn find_zero(self: &Self, p1: Vector2<f64>, p2: Vector2<f64>) -> Option<Vector2<f64>> {
		match self.zero_finding_algorithm {
			ZeroFindingAlgorithm::Bisection => self.bisection(p1, p2),
			ZeroFindingAlgorithm::RegulaFalsi => self.regula_falsi(p1, p2),
			ZeroFindingAlgorithm::Newton => self.newton(p1, p2),
			ZeroFindingAlgorithm::Interpolation => self.interpolation(p1, p2),
			ZeroFindingAlgorithm::Middle => self.middle(p1, p2),
		}
	}

	fn middle(self: &Self, p1: Vector2<f64>, p2: Vector2<f64>) -> Option<Vector2<f64>> {
		let f = self.real_function.as_ref().unwrap();
		if f(p1.x, p1.y) * f(p2.x, p2.y) > 0.0 {
			return None;
		}

		Some((p1 + p2) / 2.0)
	}

	fn interpolation(self: &Self, p1: Vector2<f64>, p2: Vector2<f64>) -> Option<Vector2<f64>> {
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

	fn bisection(self: &Self, p1: Vector2<f64>, p2: Vector2<f64>) -> Option<Vector2<f64>> {
		let f = self.real_function.as_ref().unwrap();

		let mut a = p1;
		let mut b = p2;
		
		for _ in 0..100 {
			let c = (a + b) / 2.0;
			let fc = f(c.x, c.y);
			if fc.abs() < 1e-9 {
				return Some(c);
			}
			if fc * f(a.x, a.y) < 0.0 {
				b = c;
			} else {
				a = c;
			}
		}
		return None;
	}

	fn regula_falsi(self: &Self, p1: Vector2<f64>, p2: Vector2<f64>) -> Option<Vector2<f64>> {
		let f = self.real_function.as_ref().unwrap();
		let mut a = 0.0;
		let mut b = 1.0;
		let mut c;

		for _ in 0..100 {
			let a_v = p1*(1.0-a) + p2*a;
			let b_v = p1*(1.0-b) + p2*b;

			let fa = f(a_v.x, a_v.y);
			let fb = f(b_v.x, b_v.y);
			
			c = (fb * a - fa * b) / (fb - fa);

			let c_v = p1*(1.0-c) + p2*c;
			let fc = f(c_v.x, c_v.y);

			if fc.abs() < 1e-9 {
				if c <= 0.0 || c >= 1.0 {
					return None;
				}
				return Some(c_v);
			}

			if fb*fc <= 0.0 {
				a = c;
			}
			else {
				b = c;
			}
			
		}
		return None;
	}

	fn newton(self: &Self, p1: Vector2<f64>, p2: Vector2<f64>) -> Option<Vector2<f64>> {
		let f2d = self.real_function.as_ref().unwrap();
		let h = (p1-p2).norm() * 1e-6;

		let f = |t: f64| f2d(p1.x*(1.0-t) + p2.x*t, p1.y*(1.0-t) + p2.y*t);

		let df = |t: f64| (f(t+h) - f(t)) / h;

		let mut t = 0.5;
		for _ in 0..100 {
			if 0.0 > t || t > 1.0 {
				return None;
			}
			let ft = f(t);
			if ft.abs() < 1e-9 {
				return Some(p1*(1.0-t) + p2*t);
			}
			t -= ft / df(t);
		}
		return None;
	}



	fn add_debug_rect(self: &mut Self, x: Interval, y: Interval) {
		let top_left = Vector2::new(x.inf, y.sup);
		let top_right = Vector2::new(x.sup, y.sup);
		let bottom_left = Vector2::new(x.inf, y.inf);
		let bottom_right = Vector2::new(x.sup, y.inf);

		self.add_edge_debug(top_left, top_right);
		self.add_edge_debug(top_right, bottom_right);
		self.add_edge_debug(bottom_right, bottom_left);
		self.add_edge_debug(bottom_left, top_left);
	}

	fn add_rect(self: &mut Self, x: Interval, y: Interval) {
		let top_left = Vector2::new(x.inf, y.sup);
		let top_right = Vector2::new(x.sup, y.sup);
		let bottom_left = Vector2::new(x.inf, y.inf);
		let bottom_right = Vector2::new(x.sup, y.inf);

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

	fn add_edge(self: &mut Self, p1: Vector2<f64>, p2: Vector2<f64>){
		self.result.edges.push((self.result.vertices.len()/2) as u32);
		self.result.vertices.push(p1.x as f32);
		self.result.vertices.push(p1.y as f32);
		self.result.edges.push((self.result.vertices.len()/2) as u32);
		self.result.vertices.push(p2.x as f32);
		self.result.vertices.push(p2.y as f32);
	}

	fn add_edge_debug(self: &mut Self, p1: Vector2<f64>, p2: Vector2<f64>){
		self.result.edges_debug.push((self.result.vertices_debug.len()/2) as u32);
		self.result.vertices_debug.push(p1.x as f32);
		self.result.vertices_debug.push(p1.y as f32);
		self.result.edges_debug.push((self.result.vertices_debug.len()/2) as u32);
		self.result.vertices_debug.push(p2.x as f32);
		self.result.vertices_debug.push(p2.y as f32);
	}
}