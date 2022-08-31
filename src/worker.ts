const ctx: Worker = self as any;
import { to } from 'utils';

export type WorkerSettings = {
	expression: string,
	maxDepth: number,
	showDebug: {tree: boolean, leaves: boolean},
	zeroExclusionAlgorithm: string,
	zeroFindingAlgorithm: string,
}

export type WorkerComputeMsg = {type: "compute", data: {x_inf: number, x_sup: number, y_inf: number, y_sup: number}};
export type WorkerSettingsMsg = {type: "settings", data: Partial<WorkerSettings>};
export type WorkerRequestMsg = WorkerComputeMsg | WorkerSettingsMsg;

export type WorkerResultMsg = {type: "result", data: {vertices: Float32Array, edges: Uint32Array, vertices_debug: Float32Array, edges_debug: Uint32Array}};
export type WorkerReadyMsg = {type: "ready"};
export type WorkerExpressionChangedMsg = {type: "expression_changed", data: {ok: boolean, error: string}};
export type WorkerResponseMsg = WorkerResultMsg | WorkerReadyMsg | WorkerExpressionChangedMsg;


import("../backend/pkg").then((backend) => {

	ctx.postMessage(to<WorkerReadyMsg>({
		type: "ready",
	}));
	
	ctx.onmessage = (e: MessageEvent) => {
		console.log("Worker received message:", e.data);
		let msg = e.data as WorkerRequestMsg;
		if(msg.type === "settings") {
			if(msg.data.expression !== undefined) {
				let error = backend.set_expression(msg.data.expression);
				ctx.postMessage(to<WorkerExpressionChangedMsg>({
					type: "expression_changed", 
					data: {ok: error === "", error}
				}));
			}
			if(msg.data.maxDepth !== undefined) backend.set_max_depth(msg.data.maxDepth);
			if(msg.data.showDebug !== undefined) backend.set_show_debug_tree(msg.data.showDebug.tree, msg.data.showDebug.leaves);
			if(msg.data.zeroExclusionAlgorithm !== undefined) backend.set_zero_exclusion_algorithm(msg.data.zeroExclusionAlgorithm);
			if(msg.data.zeroFindingAlgorithm !== undefined) backend.set_zero_finding_algorithm(msg.data.zeroFindingAlgorithm);
		}
		if(msg.type === "compute"){
			backend.compute(msg.data.x_inf, msg.data.x_sup, msg.data.y_inf, msg.data.y_sup);
			ctx.postMessage(to<WorkerResultMsg>({
				type: "result",
				data: {
					vertices: backend.get_vertices(),
					edges: backend.get_edges(),
					vertices_debug: backend.get_vertices_debug(),
					edges_debug: backend.get_edges_debug()
				}
			}));
		}
	}
});
