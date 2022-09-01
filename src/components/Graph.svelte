<script lang="ts">
	import { onMount } from 'svelte';
	import GraphController from "~/GraphController";

	export let expression = "";
	export let expression_error = "";
	export let auto_calculate = true;
	export let calculate = () => {};
	export let debug_draw = "hide";
	export let max_depth = 6;
	export let zero_exclusion_algorithm = "IntervalAritmetic";
	export let zero_finding_algorithm = "RegulaFalsi";
	export let duration = "";

	let canvas_gl: HTMLCanvasElement;
	let canvas_2d: HTMLCanvasElement;

	let controller: GraphController | undefined = undefined;

	onMount(() => {
		controller = new GraphController(canvas_gl, canvas_2d);

		calculate = () => controller!.compute();

		controller.expressionError.subscribe(error => {
			expression_error = error;
		});
	});

	$: controller?.setExpression(expression);
	$: controller?.setAutoCalculate(auto_calculate);
	$: controller?.setDebugDisplay(debug_draw);
	$: controller?.setMaxDepth(max_depth);
	$: controller?.setZeroExclusionAlgorithm(zero_exclusion_algorithm);
	$: controller?.setZeroFindingAlgorithm(zero_finding_algorithm);

</script>

<div class="graph">
	<canvas bind:this={canvas_2d}></canvas>
	<canvas bind:this={canvas_gl}></canvas>
</div>

<style lang="scss">
	.graph {
		width: 100%;
		height: 100%;

		display: grid;

		canvas {
			width: 100%;
			height: 100%;
			grid-area: 1 / 1;
		}
	}
</style>