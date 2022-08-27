mod utils;
mod expression_parser;
mod tracer;
use core::str;

use inari_wasm::Interval;
use tracer::*;

extern crate pest;
#[macro_use]
extern crate pest_derive;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Set the expression representing the implicit function to be plotted.
/// The expression must be a valid expression in the language defined in the expression_parser module.
#[wasm_bindgen]
pub fn set_expression(expression: String) -> String {
    unsafe{
        TRACER.set_expression(expression);
        
        if TRACER.valid_expression {
            return "".to_string();
        } else {
            return TRACER.error.clone();
        }
    }
}

/// Compute the implicit function in the given region.
#[wasm_bindgen]
pub fn compute(x_inf: f64, x_sup: f64, y_inf: f64, y_sup: f64) {
    unsafe{
        TRACER.compute(Interval{inf: x_inf, sup: x_sup}, Interval{inf: y_inf, sup: y_sup})
    }
}

#[wasm_bindgen]
pub fn get_vertices() -> Vec<f32> {
    unsafe{
        let TracerResult{vertices, ..} = &TRACER.result;
        vertices.clone()
    }
}

#[wasm_bindgen]
pub fn get_edges() -> Vec<u32> {
    unsafe{
        let TracerResult{edges, ..} = &TRACER.result;
        edges.clone()
    }
}

#[wasm_bindgen]
pub fn get_vertices_debug() -> Vec<f32> {
    unsafe{
        let TracerResult{vertices_debug, ..} = &TRACER.result;
        vertices_debug.clone()
    }
}

#[wasm_bindgen]
pub fn get_edges_debug() -> Vec<u32> {
    unsafe{
        let TracerResult{edges_debug, ..} = &TRACER.result;
        edges_debug.clone()
    }
}

#[wasm_bindgen]
pub fn get_error() -> String {
    unsafe{
        TRACER.error.clone()
    }
}

#[wasm_bindgen]
pub fn eval_at_interval(x_inf: f64, x_sup: f64, y_inf: f64, y_sup: f64) {
    unsafe{
        let Tracer{interval_function, ..} = &TRACER;
        let f = interval_function.as_ref().unwrap();
        let x = Interval{inf: x_inf, sup: x_sup};
        let y = Interval{inf: y_inf, sup: y_sup};
        log(format!("result: {}", f(x, y)).as_str());
    }
}