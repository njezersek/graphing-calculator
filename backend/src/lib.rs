mod utils;

use inari_wasm::*;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;


use lazy_static::*;

extern crate pest;
#[macro_use]
extern crate pest_derive;

use pest::Parser;
use pest::iterators::{Pairs, Pair};
use pest::prec_climber::*;

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

type F2d = Box<dyn Fn(f64, f64) -> f64>;

fn eval_to_function(expression: Pairs<Rule>) -> F2d {
    PREC_CLIMBER.climb(
        expression,
        |pair: Pair<Rule>| -> F2d {
            match pair.as_rule() {
                Rule::num => {
                    let val = pair.as_str().parse::<f64>().unwrap();
                    Box::new(move |_: f64, _: f64| val)
                },
                Rule::var_x => Box::new(move |x: f64, _: f64| x),
                Rule::var_y => Box::new(move |_: f64, y: f64| y),
                Rule::expr => eval_to_function(pair.into_inner()),
                _ => unreachable!(),
            } 
        },
        |lhs: F2d, op: Pair<Rule>, rhs: F2d| -> F2d {
            match op.as_rule() {
                Rule::add      => Box::new(move |x: f64, y: f64| lhs(x, y) + rhs(x, y)),
                Rule::subtract => Box::new(move |x: f64, y: f64| lhs(x, y) - rhs(x, y)),
                Rule::multiply => Box::new(move |x: f64, y: f64| lhs(x, y) * rhs(x, y)),
                Rule::divide   => Box::new(move |x: f64, y: f64| lhs(x, y) / rhs(x, y)),
                Rule::power    => Box::new(move |x: f64, y: f64| lhs(x, y).powf(rhs(x, y))),
                _ => unreachable!(),
            }
        }
    )
}

static mut EXPRESSION_STRING: String = String::new();
static mut EXPRESSION_FUNCTION: Option<F2d> = None;

fn create_function() -> F2d {
    Box::new(|_: f64, _: f64| 0.0)
}

#[wasm_bindgen]
pub fn set_expression(e: &str) {
    unsafe {
        EXPRESSION_STRING = e.to_string();

        let result = ExpressionParser::parse(Rule::expr, e);

        if let Ok(expr) = result {
            EXPRESSION_FUNCTION = Some(eval_to_function(expr));
        } else {
            EXPRESSION_FUNCTION = None;
        }
    }
}

pub fn get_expression() -> Option<F2d> {
    unsafe {
        match &EXPRESSION_FUNCTION {
            Some(f) => Some(Box::new(f)),
            None => None
        }
    }
}

#[wasm_bindgen]
pub fn eval_expression(x: f64, y: f64) -> Option<f64> {
    if let Some(f) = get_expression() {
        Some(f(x, y))
    } else {
        None
    }
}

#[wasm_bindgen]
pub fn get_vertices() -> Option<Vec<f32>> {
    Some(vec![0.0,0.0, 5.0,0.0, 0.0,7.0, 9.0,10.0])
}

#[wasm_bindgen]
pub fn get_edges() -> Option<Vec<u16>> {
    Some(vec![0,1, 1,2, 2,3, 3,0])
}
