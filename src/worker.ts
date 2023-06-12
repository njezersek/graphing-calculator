import { to } from '~/utils';
import init, {hello, set_expression, set_zero_exclusion_algorithm, set_zero_finding_algorithm, set_max_depth, set_show_debug_tree, compute, get_edges, get_edges_debug, get_vertices, get_vertices_debug, set_rect, eval_at_interval} from '../backend/pkg/backend';

// Worker types
export type WorkerSettings = {
	expression: string,
	maxDepth: number,
	showDebug: string,
	zeroExclusionAlgorithm: string,
	zeroFindingAlgorithm: string,
	rect: {
		x_inf: number,
		x_sup: number,
		y_inf: number,
		y_sup: number,
	}
}

export type WorkerComputeMsg = {type: "compute"};
export type WorkerEvalAtIntervalMsg = {type: "eval_at_interval", data: {x_inf: number, x_sup: number, y_inf: number, y_sup: number}};
export type WorkerSettingsMsg = {type: "settings", data: Partial<WorkerSettings>};
export type WorkerRequestMsg = WorkerComputeMsg | WorkerEvalAtIntervalMsg | WorkerSettingsMsg;

export type WorkerResultMsg = {type: "result", data: {vertices: Float32Array, edges: Uint32Array, vertices_debug: Float32Array, edges_debug: Uint32Array}};
export type WorkerReadyMsg = {type: "ready"};
export type WorkerExpressionChangedMsg = {type: "expression_changed", data: {ok: boolean, error: string}};
export type WrokerEvalAtIntervalResultMsg = {type: "eval_at_interval_result", data: {inf: number, sup: number}};
export type WorkerResponseMsg = WorkerResultMsg | WorkerReadyMsg | WorkerExpressionChangedMsg | WrokerEvalAtIntervalResultMsg;


const ctx: Worker = self as any;

let running = false;

init().then((backend) => {
	hello();

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
			if(msg.data.showDebug !== undefined) set_show_debug_tree(msg.data.showDebug == "show-all", msg.data.showDebug == "show-all" || msg.data.showDebug == "show-leaves");
			if(msg.data.zeroExclusionAlgorithm !== undefined) set_zero_exclusion_algorithm(msg.data.zeroExclusionAlgorithm);
			if(msg.data.zeroFindingAlgorithm !== undefined) set_zero_finding_algorithm(msg.data.zeroFindingAlgorithm);
			if(msg.data.rect !== undefined) {
				set_rect(msg.data.rect.x_inf, msg.data.rect.x_sup, msg.data.rect.y_inf, msg.data.rect.y_sup);
			}
		}
		if(msg.type === "compute"){
			compute();
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
		if(msg.type === "eval_at_interval"){
			let r = eval_at_interval(msg.data.x_inf, msg.data.x_sup, msg.data.y_inf, msg.data.y_sup);
			ctx.postMessage(to<WrokerEvalAtIntervalResultMsg>({
				type: "eval_at_interval_result",
				data: {
					inf: r[0],
					sup: r[1]
				}
			}));
		}
	}
});
