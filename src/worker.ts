const ctx: Worker = self as any;

console.log("worker started 👷‍♂️👷‍♂️👷‍♂️");

import('../backend/pkg').then((module) => {
	module.greet();
	module.greet_with_name("Nejc Jezersek");
	ctx.onmessage = (e: MessageEvent) => {
		console.log("got msg: ", e.data, module.get_counter_value());
		module.increment_counter();
		if(e.data.type === 'compute'){
		}
	}
})
