<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Unsubscriber } from 'svelte/store';
	import GraphController from "~/GraphController";

	let canvas_gl: HTMLCanvasElement;
	let canvas_2d: HTMLCanvasElement;

	export let controller: GraphController | undefined = undefined;


	onMount(() => {
		controller = new GraphController(canvas_gl, canvas_2d);
	});
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