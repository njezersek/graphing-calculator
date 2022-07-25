import IntervalQuadTreeTracer from "IntervalQuadTreeTracer";
import { Vec } from "Math";

const ctx: Worker = self as any;

const tracer = new IntervalQuadTreeTracer();

ctx.onmessage = (e: MessageEvent) => {
	let data = e.data;
	try{
		tracer.setExpression(data.expression);
		let [V, E] = tracer.trace(Vec.values(data.topLeft.data), Vec.values(data.bottomRight.data));
		ctx.postMessage({E, V});
	}
	catch(e){
		ctx.postMessage({E: [], V: []});
	}
}