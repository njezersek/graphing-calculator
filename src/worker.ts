const ctx: Worker = self as any;

console.log("worker started 👷‍♂️👷‍♂️👷‍♂️");

import('../backend/pkg').then((module) => {
	module.set_expression("x^2 + y");

	ctx.onmessage = (e: MessageEvent) => {
		// console.log("got msg: ", e.data);
		if(e.data.type === 'compute'){
			ctx.postMessage({
				type: 'result',
				data: {
					vertices: module.get_vertices(),
					edges: module.get_edges(),
				}
			});
		}
	}
})
