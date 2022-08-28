import { createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";
import App from "./App";

export const Layout = () => {
	const [preferedSettingsWidth, setPreferedSettingsWidth] = createSignal(400);
	const [preferedSettingsHeight, setPreferedSettingsHeight] = createSignal(400);
	const [windowSize, setWindowSize] = createSignal({width: 0, height: 0});
	const horizontalLayout = () => windowSize().width > windowSize().height;

	let canvas_gl = <canvas></canvas> as HTMLCanvasElement;
	let canvas_2d = <canvas></canvas> as HTMLCanvasElement;

	let grabbing = false;
	
	function onResize(){
		setWindowSize({width: window.innerWidth, height: window.innerHeight});
	}

	function move(x: number, y: number){
		if(!grabbing) return;

		if(horizontalLayout()) {
			setPreferedSettingsWidth(x);
		} else {
			setPreferedSettingsHeight(windowSize().height - y);
		}
	}

	onMount(() => {
		window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
		window.addEventListener("touchmove", e => move(e.touches[0].clientX, e.touches[0].clientY));
		window.addEventListener("mouseup", e => grabbing = false);
		window.addEventListener("resize", onResize);

		new App(canvas_gl, canvas_2d);

		onResize();
	});

	const menuWidth = () => Math.max(5, Math.min(windowSize().width*0.9, preferedSettingsWidth()));
	const menuHeight = () => Math.max(5, Math.min(windowSize().height*0.9, preferedSettingsHeight()));

	
	return <>
	<div class="container" style={horizontalLayout() ? `flex-direction: row-reverse` : `flex-direction: column`}>
		<main>
			{canvas_2d} {canvas_gl}
		</main>
		<div class="menu-container" style={
				horizontalLayout() 
				? `grid-row: 1; flex-direction: row-reverse; min-width: ${menuWidth()}px; max-width: ${menuWidth()}px;` 
				: `flex-direction: column; min-height: ${menuHeight()}px; max-height: ${menuHeight()}px;`
		}>
			<div 
				class="handle" 
				style={horizontalLayout() ? "min-width: 5px; cursor: ew-resize;" : "min-height: 5px; cursor: ns-resize"} 
				onmousedown={() => grabbing = true} ontouchstart={() => grabbing = true}
			/>
			<div class="menu"></div>
		</div>
	</div>
	</>
};

document.body.innerHTML = "";

render(() => <Layout />, document.body);
