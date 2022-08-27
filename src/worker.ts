const ctx: Worker = self as any;

console.log("worker started 👷‍♂️👷‍♂️👷‍♂️");

import('../backend/pkg').then((backend) => {
	// module.set_expression("x^y - 1.1");
	backend.set_expression("x^2 + y^2 + 3*sin(10*x^3) - 1");
	// backend.set_expression("y - tan(x)");
	// backend.set_expression("y - x");
	
	ctx.onmessage = (e: MessageEvent) => {
		let data = e.data.data;
		if(e.data.type === "settings") settings(data);
		if(e.data.type === 'compute') compute(data);
	}

	function settings(data: any){
		if(data.key === "expression"){
			backend.set_expression(data.value);
		}
	}

	function compute(data: any){
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
});
