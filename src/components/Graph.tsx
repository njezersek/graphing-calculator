import GraphController from "GraphController";
import { Component, createEffect, onMount } from "solid-js";

export const Graph = (props: {expression: string}) => {
	let canvas_gl = <canvas></canvas> as HTMLCanvasElement;
	let canvas_2d = <canvas></canvas> as HTMLCanvasElement;

	let app: GraphController;

	onMount(() => {
		app = new GraphController(canvas_gl, canvas_2d);
	});

	createEffect(() => {
		app.setExpression(props.expression)
	});

	return <div class="graph-container">{canvas_2d} {canvas_gl}</div>
}