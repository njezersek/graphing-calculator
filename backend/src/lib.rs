mod utils;

use inari_wasm::*;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static mut counter: i32 = 0;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    log("Hello, world from Rust 🦀🦀🦀!");
}

#[wasm_bindgen]
pub fn greet_with_name(name: &str) {
    log(&format!("Hello, {} from Rust!", name));
}

#[wasm_bindgen]
pub fn add_two_numbers(a: f64, b: f64) -> f64 {
    a + b
}

#[wasm_bindgen]
pub fn sum_of_numbers(numbers: &[f64]) -> f64 {
    numbers.iter().sum()
}

#[wasm_bindgen]
pub fn test_inari(){
    let a = const_interval!(0.0, 1.0);
    let b = const_interval!(0.0, 1.0);

    log(&format!("{} + {} = {}", a, b, a + b));
}

#[wasm_bindgen]
pub fn benchmark(){
    let N = 1_000_00;
    let x = const_interval!(10.0, 20.0);
    let y = const_interval!(10.0, 20.0);

    let mut sum = 0.0;
    for _ in 0..N {
        let r = x.powi(2) + y.powi(2) + const_interval!(3.0) * (const_interval!(10.0) * x.powi(3)).sin() - const_interval!(1.0);
        sum += r.inf;
    }
    log(&format!("{}", sum));
}

#[wasm_bindgen]
pub fn increment_counter() {
    unsafe {
        counter += 1;
    }
}

#[wasm_bindgen]
pub fn get_counter_value() -> i32 {
    unsafe {
        counter
    }
}