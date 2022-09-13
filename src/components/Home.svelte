<script lang="ts">
	import Graph from '~/components/Graph.svelte'
	import type GraphController from '~/GraphController';
	import Layout from './Layout.svelte';
	import Menu from './Menu.svelte';

	let controller: GraphController | undefined;

	let menuHidden = false;

</script>


<Layout bind:menuHidden>
	<div slot="menu" style="width: 100%">
		{#if controller !== undefined}
			<Menu controller={controller} bind:menuHidden/>
		{/if}
	</div>
	<Graph slot="main" bind:controller />
</Layout>

<style>

</style>