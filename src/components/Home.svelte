<script lang="ts">
	import Graph from '~/components/Graph.svelte'
	import Layout from './Layout.svelte';
	import Menu from './Menu.svelte';

	export let expression = "x^2 - y^2 - 1";
	export let expression_error = "";
	export let auto_calculate = true;
	export let calculate: () => void;
	export let debug_draw = "hide";
	export let max_depth = 6;
	export let zero_exclusion_algorithm = "IntervalAritmetic";
	export let zero_finding_algorithm = "RegulaFalsi";
	export let duration = "";
</script>

<!-- <div class="container">
	<Menu bind:expression {expression_error} {calculate} bind:debug_draw bind:max_depth bind:zero_exclusion_algorithm bind:zero_finding_algorithm {duration}/>
</div>
<div class="container">
	<Graph {expression} bind:expression_error {auto_calculate} bind:calculate {debug_draw} {max_depth} {zero_exclusion_algorithm} {zero_finding_algorithm} bind:duration/>
</div> -->

<Layout>
	<Menu slot="menu" bind:expression {expression_error} bind:auto_calculate {calculate} bind:debug_draw bind:max_depth bind:zero_exclusion_algorithm bind:zero_finding_algorithm {duration}/>
	<Graph slot="main" {expression} bind:expression_error {auto_calculate} bind:calculate {debug_draw} {max_depth} {zero_exclusion_algorithm} {zero_finding_algorithm} bind:duration/>
</Layout>

<style>

</style>