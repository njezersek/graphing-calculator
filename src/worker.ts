const ctx: Worker = self as any;

console.log("worker started 👷‍♂️👷‍♂️👷‍♂️");

import('../backend/pkg').then((backend) => {
	// module.set_expression("x^y - 1.1");
	backend.set_expression("x^2 + y^2 + 3*sin(10*x^3) - 1");
	// backend.set_expression("y - tan(x)");
	// backend.set_expression("y - x");
	
	ctx.onmessage = (e: MessageEvent) => {
		let data = e.data.data;
		if(e.data.type === "settings") {
			if(data.key === "expression"){
				let error = backend.set_expression(data.value);
				console.log("err: ", error);
				ctx.postMessage({
					type: "expression_changed",
					data: {
						ok: error === "",
						error: error
					}
				})
			}
		};
		if(e.data.type === 'compute'){
			backend.compute(data.x_inf, data.x_sup, data.y_inf, data.y_sup);
			ctx.postMessage({
				type: 'result',
				data: {
					vertices: backend.get_vertices(),
					edges: backend.get_edges(),
					vertices_debug: backend.get_vertices_debug(),
					edges_debug: backend.get_edges_debug()
				}
			});
		}
	}
});
