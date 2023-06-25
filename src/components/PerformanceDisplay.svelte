<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { exclude_internal_props } from "svelte/internal";
    import type Timer from "~/Timer";

	export let timer: Timer;
	export let autoScale = false;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let running = true;
	let x = 0;

	let mediaQueryLightTheme: MediaQueryList;

	onMount(() => {
		ctx = canvas.getContext("2d")!;

		mediaQueryLightTheme = window.matchMedia("(prefers-color-scheme: light)");

		new ResizeObserver(() => {
			canvas.width = canvas.parentElement!.clientWidth * window.devicePixelRatio;
			canvas.height = canvas.parentElement!.clientHeight * window.devicePixelRatio;
		}).observe(canvas);

		tick();
	});

	onDestroy(() => {
		running = false;
	});


	function tick(){
		if(!running) return;

		let now = performance.now();

		let backgroundColor = "#333";
		let scaleColor = "rgba(255, 255, 255, 0.2)";
		let graphColor = "#118f0c";
		if(mediaQueryLightTheme && mediaQueryLightTheme.matches){
			backgroundColor = "#dedede";
			scaleColor = "rgba(0, 0, 0, 0.2)"
			graphColor = "#8ae34a";
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let maxHeight = 0;
		for(let i = 0; i < timer.history.length; i++){
			let [start, end] = timer.history[i];

			let x1 = ((start - now + timer.historyDuration) / timer.historyDuration) * canvas.width;
			let x2 = ((end - now + timer.historyDuration) / timer.historyDuration) * canvas.width;
			let d = x2 - x1;

			if(d > maxHeight) maxHeight = d;
		}

		if(maxHeight == 0) maxHeight = 1;
		let scale = canvas.height / maxHeight;

		
		for(let i = 0; i < timer.history.length; i++){
			let [start, end] = timer.history[i];

			let x1 = ((start - now + timer.historyDuration) / timer.historyDuration) * canvas.width;
			let x2 = ((end - now + timer.historyDuration) / timer.historyDuration) * canvas.width;
			let d = x2 - x1;
			let h = autoScale ? d * scale : d;
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(x1, 0, canvas.width - x1, canvas.height);
			ctx.fillStyle = graphColor;
			ctx.fillRect(x1, canvas.height-h, canvas.width - x1, h);
			// ctx.fillStyle = "#33ff2c";
			ctx.fillRect(x1, canvas.height-h, d, h);
		}

		// horizontal scale
		for(let i = 0; i <= timer.historyDuration; i += 1_000){
			let x = ((i - (now - Math.floor(now/1000)*1000)) / timer.historyDuration) * canvas.width;

			ctx.fillStyle = scaleColor;
			ctx.fillRect(x, 0, 1, canvas.height);
		}

		window.requestAnimationFrame(() => tick());		
	}
</script>

	<canvas bind:this={canvas}></canvas>

<style lang="scss">
	canvas {
		width: 100%;
		height: 100%;
		position: absolute;
	}

	.container {
		width: 100%;
		height: 100%;
		background-color: #118f0c;
		position: relative;
	}
</style>