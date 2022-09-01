<script lang="ts">
	import { onMount } from "svelte";

	let container: HTMLDivElement;
	let handle: HTMLDivElement;

	let horizontal = window.innerWidth > window.innerHeight;
	let width = 0;
	let height = 0;
	let menuDesiredWidth = 500;
	let menuDesiredHeight = 500;
	let grabbing = false;

	function updateSize(x: number, y: number) {
		if (grabbing) {
			if (horizontal) {
				menuDesiredWidth = x - container.offsetLeft;
			} else {
				menuDesiredHeight = y - container.offsetTop;
			}
		}
	}

	onMount(() => {
		new ResizeObserver(els => {
			width = container.clientWidth;
			height = container.clientHeight;
			horizontal = width > height;
		}).observe(container);
	});

</script>

<div 
	bind:this={container} 
	class="container {horizontal ? "horizontal" : "vertical"}" 
	style="{horizontal ? `grid-template-columns: ${menuDesiredWidth}px 1fr` : `grid-template-rows: ${menuDesiredHeight}px 1fr`}"
	on:mousemove={e => updateSize(e.clientX, e.clientY)}
	on:touchmove={e => updateSize(e.touches[0].clientX, e.touches[0].clientY)}
	on:mouseup={e => grabbing = false}
	on:touchend={e => grabbing = false}
>
	<div class="menu">
		<slot name="menu"/>
		<div class="handle" bind:this={handle} on:mousedown={() => grabbing = true} on:touchstart={() => grabbing = true}></div>
	</div>
	<div class="main">
		<slot name="main"/>
	</div>
</div>

<style lang="scss">
	.container {
		width: 100%;
		height: 100%;
		display: grid;
		overflow: hidden;
		
		&.vertical {
			grid-template-columns: 1fr;
			grid-template-areas: "main" "menu";
			
			.handle {
				width: 100%;
				height: 10px;
				position: absolute;
				top: 0;
				left: 0;
				cursor: ns-resize;
			}
		}
	
		&.horizontal {
			grid-template-rows: 1fr;
			grid-template-areas: "menu main";

			.handle {
				width: 10px;
				height: 100%;
				position: absolute;
				top: 0;
				right: 0;
				cursor: ew-resize;
			}
		}

		.menu {
			grid-area: menu;
			position: relative;
			overflow: hidden;
			box-shadow: rgb(0 0 0 / 90%) 0px 0px 20px;
		}
	
		.main {
			grid-area: main;
			overflow: hidden;
		}
	}


</style>
