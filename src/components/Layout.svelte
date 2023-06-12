<script lang="ts">
	import { onMount } from "svelte";
	import menu from "~/img/menu.png";

	let container: HTMLDivElement;

	let horizontal = window.innerWidth > window.innerHeight;
	let width = 0;
	let height = 0;
	let menuDesiredWidth = 500;
	let menuDesiredHeight = 500;
	let grabbing = false;
	export let menuHidden = false;

	$: menuWidth = menuHidden ? 0 : Math.max(300, Math.min(menuDesiredWidth, width-100));
	$: menuHeight = menuHidden ? 0 : Math.max(200, Math.min(menuDesiredHeight, height-100));

	function updateSize(x: number, y: number) {
		if (grabbing) {
			if (horizontal) {
				menuDesiredWidth = x - container.offsetLeft;
			} else {
				menuDesiredHeight = container.offsetHeight - y - container.offsetTop;
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
	style="{horizontal ? `grid-template-columns: ${menuWidth}px 1fr` : `grid-template-rows: 1fr ${menuHeight}px`}"
	on:mousemove={e => updateSize(e.clientX, e.clientY)}
	on:touchmove={e => updateSize(e.touches[0].clientX, e.touches[0].clientY)}
	on:mouseup={e => grabbing = false}
	on:touchend={e => grabbing = false}
	on:mouseleave={e => grabbing = false}
>
	<button class="open-menu" on:click={() => menuHidden = false}>
		<img src={menu} alt="open menu"/>
	</button>
	<div class="handle-container">
		<div class="handle" on:mousedown|preventDefault={() => grabbing = true} on:touchstart|preventDefault={() => grabbing = true}></div>
	</div>
	{ #if !menuHidden }
		<div class="menu">
			<slot name="menu"/>
		</div>
	{ /if }
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
				height: 30px;
				z-index: 1;
				position: absolute;
				top: -15px;
				left: 0;
				cursor: ns-resize;
			}

			.open-menu{
				bottom: 10px;
				right: 10px;
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
				right: -10px;
				cursor: ew-resize;
			}

			.open-menu{
				top: 10px;
				left: 10px;
			}
		}

		.menu {
			grid-area: menu;
			position: relative;
			overflow: hidden;
			display: flex;
			box-shadow: rgb(0 0 0 / 90%) 0px 0px 20px;
		}

		@media (prefers-color-scheme: light) {
			.menu {
				box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
			}
		}
		
		.main {
			grid-area: main;
			overflow: hidden;
		}

		.handle-container {
			width: 100%;
			height: 100%;
			grid-area: menu;
			position: relative;
		}
	}

	.open-menu{
		position: absolute;
		border: none;
		outline: none;
		width: auto;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 40px;
		height: 40px;
		padding: 10px;
		border-radius: 50%;
		background-color: transparent;
		transition: background-color 100ms ease-in-out;

		&:active{
			background-color: rgba(39, 76, 104, 0.5);
		}

		img{
			width: 100%;
			height: 100%;
		}
	}


</style>
