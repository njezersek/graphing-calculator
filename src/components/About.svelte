<script lang="ts">
	import { Link } from "svelte-navigator";

	let state = {
		a: 0,
		b: 0,
		c: 0
	};

	$: {
		let sum = state.a;
		console.log("sum!!!!");
	}
</script>

<h1>About</h1>
<Link to="/">Home</Link>
<Link to="/about">About</Link>

<pre>{JSON.stringify(state, null, 2)}</pre>

<button on:click={() => state.a++}>a++</button>
<button on:click={() => state.b++}>b++</button>