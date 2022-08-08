mod utils;
mod expression_parser;
mod tracer;
use inari_wasm::Interval;
use tracer::*;


use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;


extern crate pest;
#[macro_use]
extern crate pest_derive;

/*
 API
 - get_vertices() -> Option<Vec<f32>>
 - get_edges() -> Option<Vec<u32>>
 - set_expression(expression: String) -> ()
 - compute(x_inf: f64, x_sup: f64, y_inf: f64, y_sup: f64) -> ()
*/

#[wasm_bindgen]
pub fn set_expression(expression: String) {
    unsafe{
        TRACER.set_expression(expression);
    }
}

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
pub fn eval_at_interval(x_inf: f64, x_sup: f64, y_inf: f64, y_sup: f64) {
    unsafe{
        let Tracer{interval_function, ..} = &TRACER;
        let f = interval_function.as_ref().unwrap();
        let x = Interval{inf: x_inf, sup: x_sup};
        let y = Interval{inf: y_inf, sup: y_sup};
        log(format!("result: {}", f(x, y)).as_str());
    }
}