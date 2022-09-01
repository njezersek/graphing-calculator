import { to } from '~/utils';
import init, {set_expression, set_zero_exclusion_algorithm, set_zero_finding_algorithm, set_max_depth, set_show_debug_tree, compute, get_edges, get_edges_debug, get_vertices, get_vertices_debug} from 'backend';


// Worker types
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


const ctx: Worker = self as any;

init().then((backend) => {
	// console.log("Backend ready");

	ctx.postMessage(to<WorkerReadyMsg>({
		type: "ready",
	}));
	
	ctx.onmessage = (e: MessageEvent) => {
		// console.log("Worker received message:", e.data);
		let msg = e.data as WorkerRequestMsg;
		if(msg.type === "settings") {
			if(msg.data.expression !== undefined) {
				let error = set_expression(msg.data.expression);
				ctx.postMessage(to<WorkerExpressionChangedMsg>({
					type: "expression_changed", 
					data: {ok: error === "", error}
				}));
			}
			if(msg.data.maxDepth !== undefined) set_max_depth(msg.data.maxDepth);
			if(msg.data.showDebug !== undefined) set_show_debug_tree(msg.data.showDebug.tree, msg.data.showDebug.leaves);
			if(msg.data.zeroExclusionAlgorithm !== undefined) set_zero_exclusion_algorithm(msg.data.zeroExclusionAlgorithm);
			if(msg.data.zeroFindingAlgorithm !== undefined) set_zero_finding_algorithm(msg.data.zeroFindingAlgorithm);
		}
		if(msg.type === "compute"){
			compute(msg.data.x_inf, msg.data.x_sup, msg.data.y_inf, msg.data.y_sup);
			ctx.postMessage(to<WorkerResultMsg>({
				type: "result",
				data: {
					vertices: get_vertices(),
					edges: get_edges(),
					vertices_debug: get_vertices_debug(),
					edges_debug: get_edges_debug()
				}
			}));
		}
	}
});
