const ctx: Worker = self as any;

console.log("worker started 👷‍♂️👷‍♂️👷‍♂️");

import('../backend/pkg').then((backend) => {
	// module.set_expression("x^y - 1.1");
	backend.set_expression("x^2 + y^2 + 3*sin(10*x^3) - 1");
	// module.set_expression("x^2 - y");
	
	ctx.onmessage = (e: MessageEvent) => {
		// console.log("got msg: ", e.data);
		if(e.data.type === 'compute'){
			let data = e.data.data;
			console.log(data.x_inf, data.x_sup, data.y_inf, data.y_sup);
			backend.compute(data.x_inf, data.x_sup, data.y_sup, data.y_inf); // TO_DO: fix this inconsistency
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
})
