
use inari_wasm::*;
use lazy_static::*;

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
            Operator::new(add, Left) | Operator::new(subtract, Left),
            Operator::new(multiply, Left) | Operator::new(divide, Left),
            Operator::new(power, Right)
        ])
    };
}

pub type F2di = Box<dyn Fn(Interval, Interval) -> Interval>;
pub type F2df = Box<dyn Fn(f64, f64) -> f64>;

pub fn eval_to_interval_function(expression: Pairs<Rule>) -> F2di {
    PREC_CLIMBER.climb(
        expression,
        |pair: Pair<Rule>| -> F2di {
            match pair.as_rule() {
                Rule::num => {
                    let val = pair.as_str().parse::<f64>().unwrap();
                    Box::new(move |_, _| Interval{inf: val, sup: val})
                },
                Rule::var_x => Box::new(move |x, _| x),
                Rule::var_y => Box::new(move |_, y| y),
				Rule::sin => {
					let arg = eval_to_interval_function(pair.into_inner());
					Box::new(move |x, y| arg(x, y).sin())
				},
				Rule::cos => {
					let arg = eval_to_interval_function(pair.into_inner());
					Box::new(move |x, y| arg(x, y).cos())
				},
				Rule::tan => {
					let arg = eval_to_interval_function(pair.into_inner());
					Box::new(move |x, y| arg(x, y).tan())
				},
                Rule::expr => eval_to_interval_function(pair.into_inner()),
                _ => unreachable!(),
            } 
        },
        |lhs: F2di, op: Pair<Rule>, rhs: F2di| -> F2di {
            match op.as_rule() {
                Rule::add      => Box::new(move |x, y| lhs(x, y) + rhs(x, y)),
                Rule::subtract => Box::new(move |x, y| lhs(x, y) - rhs(x, y)),
                Rule::multiply => Box::new(move |x, y| lhs(x, y) * rhs(x, y)),
                Rule::divide   => Box::new(move |x, y| lhs(x, y) / rhs(x, y)),
                Rule::power    => Box::new(move |x, y| {
					let e = rhs(x, y);
					if e.is_singleton() && e.inf.fract() == 0.0  { lhs(x, y).powi(e.inf as i32) }
					else { lhs(x, y).pow(rhs(x, y)) }
				}),
                _ => unreachable!(),
            }
        }
    )
}


pub fn eval_to_real_function(expression: Pairs<Rule>) -> F2df {
	PREC_CLIMBER.climb(
		expression,
		|pair: Pair<Rule>| -> F2df {
			match pair.as_rule() {
				Rule::num => {
					let val = pair.as_str().parse::<f64>().unwrap();
					Box::new(move |_, _| val)
				},
				Rule::var_x => Box::new(move |x, _| x),
				Rule::var_y => Box::new(move |_, y| y),
				Rule::sin => {
					let arg = eval_to_real_function(pair.into_inner());
					Box::new(move |x, y| arg(x, y).sin())
				},
				Rule::cos => {
					let arg = eval_to_real_function(pair.into_inner());
					Box::new(move |x, y| arg(x, y).cos())
				},
				Rule::tan => {
					let arg = eval_to_real_function(pair.into_inner());
					Box::new(move |x, y| arg(x, y).tan())
				},
				Rule::expr => eval_to_real_function(pair.into_inner()),
				_ => unreachable!(),
			} 
		},
		|lhs: F2df, op: Pair<Rule>, rhs: F2df| -> F2df {
			match op.as_rule() {
				Rule::add      => Box::new(move |x, y| lhs(x, y) + rhs(x, y)),
				Rule::subtract => Box::new(move |x, y| lhs(x, y) - rhs(x, y)),
				Rule::multiply => Box::new(move |x, y| lhs(x, y) * rhs(x, y)),
				Rule::divide   => Box::new(move |x, y| lhs(x, y) / rhs(x, y)),
				Rule::power    => Box::new(move |x, y| lhs(x, y).powf(rhs(x, y))),
				_ => unreachable!(),
			}
		}
	)
}


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


