import { createSignal, onMount } from "solid-js";
import { Graph } from "./Graph";

import { Menu } from "./Menu";

export const Layout = () => {
	const [preferedSettingsWidth, setPreferedSettingsWidth] = createSignal(400);
	const [preferedSettingsHeight, setPreferedSettingsHeight] = createSignal(400);
	const [windowSize, setWindowSize] = createSignal({width: 0, height: 0});
	const horizontalLayout = () => windowSize().width > windowSize().height;

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

		onResize();
	});

	const menuWidth = () => Math.max(5, Math.min(windowSize().width*0.9, preferedSettingsWidth()));
	const menuHeight = () => Math.max(5, Math.min(windowSize().height*0.9, preferedSettingsHeight()));

	
	return <>
	<div class="container" style={horizontalLayout() ? `flex-direction: row-reverse` : `flex-direction: column`}>
		<main>
			<Graph expression="x^2 - y"/>
		</main>
		<div class="menu-container" style={
				horizontalLayout() 
				? `grid-row: 1; min-width: ${menuWidth()}px; max-width: ${menuWidth()}px;` 
				: `min-height: ${menuHeight()}px; max-height: ${menuHeight()}px;`
		}>
			<div 
				class={`handle ${horizontalLayout() ? "horizontal" : "vertical"}`} 
				onmousedown={() => grabbing = true} ontouchstart={() => grabbing = true}
			/>
			<div class="menu">
				<Menu />
			</div>
		</div>
	</div>
	</>
};