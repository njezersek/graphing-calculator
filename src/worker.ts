import IntervalQuadTreeTracer from "IntervalQuadTreeTracer";
import { Vec } from "Math";

const ctx: Worker = self as any;

const tracer = new IntervalQuadTreeTracer();

console.log("worker started");

ctx.onmessage = (e: MessageEvent) => {
	if(e.data.type === 'compute'){
		console.log("got msg", e.data);
		let data = e.data.data;
		try{
			tracer.setExpression(data.expression);
			let [V, E, Vdebug, Edebug] = tracer.trace(Vec.values(data.topLeft.data), Vec.values(data.bottomRight.data));
			ctx.postMessage({ type: "result", data: {E, V, Edebug, Vdebug} });
		}
		catch(err){
			ctx.postMessage({ type: "error", data: err });
		}
	}
}