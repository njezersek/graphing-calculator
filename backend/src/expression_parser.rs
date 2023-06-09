
use core::f64;
use std::any::Any;
use std::ops::{Add, Sub, Mul, Div};

use inari_wasm::*;
use lazy_static::*;
extern crate inari_wasm;

extern crate pest;
use pest::iterators::{Pairs, Pair};
use pest::{prec_climber::*, Parser};


#[derive(Parser)]
#[grammar = "grammar.pest"]
pub struct ExpressionParser;

lazy_static! {
    static ref PREC_CLIMBER: PrecClimber<Rule> = {
        use Rule::*;
        use Assoc::*;

        PrecClimber::new(vec![
            Operator::new(equals, Left),
            Operator::new(add, Left) | Operator::new(subtract, Left),
            Operator::new(multiply, Left) | Operator::new(divide, Left),
            Operator::new(power, Right)
        ])
    };
}

pub type F2di = Box<dyn Fn(Interval, Interval) -> Interval>;
pub type F2df = Box<dyn Fn(f64, f64) -> f64>;

pub trait Computable {
	fn compute_pow(&self, e: Self) -> Self;
	fn compute_sign(&self) -> Self;
	fn from_str(s: &str) -> Self;
}

impl Computable for f64 {
	fn compute_pow(&self, e: Self) -> Self {
		self.powf(e)
	}

	fn compute_sign(&self) -> Self {
		if *self < 0.0 { -1.0 }
		else if *self > 0.0 { 1.0 }
		else { 0.0 }
	}

	fn from_str(s: &str) -> Self {
		s.parse::<f64>().unwrap()
	}
}

impl Computable for Interval {
	fn compute_pow(&self, e: Self) -> Self {
		if e.is_singleton() && e.inf.fract() == 0.0 { self.powi(e.inf as i32) }
		else { self.pow(e) }
	}

	fn compute_sign(&self) -> Self {
		self.sign()
	}

	fn from_str(s: &str) -> Self {
		let val = s.parse::<f64>().unwrap();
		Interval{inf: val, sup: val}
	}
}

macro_rules! implement_fun {
	($name:ident, $type:ty) => {
		fn $name(expression: Pairs<Rule>) -> Box<dyn Fn($type, $type) -> $type>{
			PREC_CLIMBER.climb(
				expression,
				|pair: Pair<Rule>| -> Box<dyn Fn($type, $type) -> $type> {
					match pair.as_rule() {
						Rule::num => {
							let val = <$type>::from_str(pair.as_str());
							Box::new(move |_, _| val)
						},
						Rule::var_x => Box::new(move |x, _| x),
						Rule::var_y => Box::new(move |_, y| y),
						Rule::sin => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).sin())
						},
						Rule::asin => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).asin())
						},
						Rule::cos => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).cos())
						},
						Rule::acos => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).acos())
						},
						Rule::tan => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).tan())
						},
						Rule::atan => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).atan())
						},
						Rule::sinh => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).sinh())
						},
						Rule::asinh => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).asinh())
						},
						Rule::cosh => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).cosh())
						},
						Rule::acosh => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).acosh())
						},
						Rule::tanh => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).tanh())
						},
						Rule::atanh => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).atanh())
						},
						Rule::exp => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).exp())
						},
						Rule::ln => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).ln())
						},
						Rule::log2 => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).log2())
						},
						Rule::log10 => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).log10())
						},
						Rule::abs => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).abs())
						},
						Rule::sign => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).compute_sign())
						},
						Rule::round => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).round())
						},
						Rule::ceil => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).ceil())
						},
						Rule::floor => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| arg(x, y).floor())
						},
						Rule::min => {
							let mut inner_rules = pair.into_inner();
							let a = $name(inner_rules.next().unwrap().into_inner());
							let b = $name(inner_rules.next().unwrap().into_inner());
							Box::new(move |x, y| a(x, y).min(b(x, y)))
						},
						Rule::max => {
							let mut inner_rules = pair.into_inner();
							let a = $name(inner_rules.next().unwrap().into_inner());
							let b = $name(inner_rules.next().unwrap().into_inner());
							Box::new(move |x, y| a(x, y).max(b(x, y)))
						}
						Rule::negated_term => {
							let arg = $name(pair.into_inner());
							Box::new(move |x, y| -arg(x, y))
						},
						Rule::expr => $name(pair.into_inner()),
						_ => unreachable!(),
					}
				},
				|lhs: Box<dyn Fn($type, $type) -> $type>, op: Pair<Rule>, rhs: Box<dyn Fn($type, $type) -> $type>| -> Box<dyn Fn($type, $type) -> $type> {
					match op.as_rule() {
						Rule::equals   => Box::new(move |x, y| lhs(x, y) - rhs(x, y)),
						Rule::add      => Box::new(move |x, y| lhs(x, y) + rhs(x, y)),
						Rule::subtract => Box::new(move |x, y| lhs(x, y) - rhs(x, y)),
						Rule::multiply => Box::new(move |x, y| lhs(x, y) * rhs(x, y)),
						Rule::divide   => Box::new(move |x, y| lhs(x, y) / rhs(x, y)),
						Rule::power    => Box::new(move |x, y| lhs(x, y).compute_pow(rhs(x, y))),
						_ => unreachable!(),
					}
				}
			)
		}
	}
}


implement_fun!(eval_to_real_function, f64);
implement_fun!(eval_to_interval_function, Interval);

pub fn get_function(expression: String) -> Result<(F2df, F2di), String> {
	let result = ExpressionParser::parse(Rule::calculation, &expression);

	match result {
		Ok(expr) => {
			Ok(
				(
					eval_to_real_function(expr.clone()), 
					eval_to_interval_function(expr.clone())
				)
			)
		}
		Err(e) => {
			Err(e.to_string())
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	
	#[test]
	fn test_1() {
		let result = get_function("x + y".to_string());
		assert!(result.is_ok());
		let (f, _) = result.unwrap();
		assert_eq!(f(1.0, 2.0), 3.0);

		let a = Interval{inf: 1.0, sup: 2.0};
		let b = Interval{inf: 3.0, sup: 4.0};

		let r = a.min(b);
		println!("{}", r);
	}
}
