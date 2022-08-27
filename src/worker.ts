const ctx: Worker = self as any;

console.log("worker started 👷‍♂️👷‍♂️👷‍♂️");

import('../backend/pkg').then((backend) => {
	
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
			if(data.key === "debug_tree"){
				backend.set_show_debug_tree(data.showDebugTree, data.showDebugLeaves);
			}
			if(data.key === "max_depth"){
				backend.set_max_depth(data.value);
			}
			if(data.key === "zero_exclusion_algorithm"){
				backend.set_zero_exclusion_algorithm(data.value);
			}
			if(data.key === "zero_finding_algorithm"){
				backend.set_zero_finding_algorithm(data.value);
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
