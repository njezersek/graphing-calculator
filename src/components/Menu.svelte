<script lang="ts">
	import type GraphController from "~/GraphController";

	import hide from "~/img/hide.png";

	export let controller: GraphController;

	let {
		expression, maxDepth, showDebug, zeroExclusionAlgorithm, 
		zeroFindingAlgorithm, autoCalculate, expressionError, timingDisplay
	} = controller;


	export let menuHidden = false;
</script>

<div class="container">
	<header>
		<h1>Implicit function plotter</h1>
		<button on:click={() => menuHidden = true}>
			<img class="" src={hide} alt="hide">
		</button>
	</header>
	<div class="scroll">
		<section>
			<label for="expression-input">Function expression:</label>
		<input bind:value={$expression} id="expression-input" type="text" class="monospace" />
		<pre class="error-display">{$expressionError}</pre>
	</section>
	<section>
		<div class="row">
			<div class="vertical-center">
				<label class="checkbox-label">
					<input bind:checked={$autoCalculate} type="checkbox" id="auto-calculate-checkbox" />
					Auto-calculate
				</label>
			</div>
			<div>
				<button id="calculate-button" on:click={() => controller.compute()}>calculate</button>
			</div>
		</div>
	</section>
	<div class="divider"></div>
	<section>
		<label for="quad-tree-display-select">Quad tree debug draw </label>
		<select bind:value={$showDebug} id="quad-tree-display-select">
			<option value="hide">Hide tree structure</option>
			<option value="show-all">Show full tree structure</option>
			<option value="show-leaves">Show only leaves</option>
		</select>
	</section>
	<div class="divider"></div>
	<section>
		<div class="row">
			<label for="max-depth-input">Max tree depth</label>
			<div style="text-align: end" id="max-depth-display">{$maxDepth}</div>
		</div>
		<input bind:value={$maxDepth} type="range" min="1" max="16" step="1" id="max-depth-input" />
	</section>
	<section>
		<label for="zero-exclusion-algorithm-select">Zero exclusion algorithm</label>
		<select bind:value={$zeroExclusionAlgorithm} id="zero-exclusion-algorithm-select">
			<option value="IntervalAritmetic">Interval arithmetic</option>
			<option value="SignIntervalCombo">Sign difference + interval arithmetic</option>
			<option value="SignDifference">Sign difference</option>
			<option value="Disabled">Ignore</option>
		</select>
	</section>
	<section>
		<label for="zero-finding-algorighm-select">Zero finding algorithm</label>
		<select bind:value={$zeroFindingAlgorithm} id="zero-finding-algorithm-select">
			<option value="RegulaFalsi">Regula Falsi</option>
			<option value="Bisection">Bisection</option>
			<option value="Interpolation">Interpolation</option>
			<option value="Middle">Midpoint</option>
		</select>
	</section>
	<div class="divider"></div>
	<section>
		<label for="duration-display">Computation duration</label>
		<div class="duration-display" id="duration-display">
			{$timingDisplay}
		</div>
	</section>
</div>
</div>

<style lang="scss">
	.container {
		width: 100%;
		height: 100%;
		overflow: hidden;
		background-color: #181818;
		color: #fff;
		display: flex;
		flex-direction: column;
	}

	header{
		padding: 5px 15px;
		font-family: 'Roboto Slab';
		background-color: #25435f;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.9);
		display: flex;
		justify-content: space-between;
		align-items: center;

		h1{
			font-size: 20px;
			margin: 0;
			outline: none;
		}

		button{
			width: auto;
			display: flex;
			justify-content: center;
			align-items: center;
			width: 40px;
			height: 40px;
			padding: 10px;
			border-radius: 50%;
			background-color: #25435f;

			&:active{
				background-color: rgb(39, 76, 104);
			}

			img{
				width: 100%;
				height: 100%;
			}
		}
	}

	.scroll {
		overflow-y: scroll;
		overflow-x: hidden;
		height: 100%;
	}

	section{
		margin: 15px 15px;
	}

	.duration-display{
		min-height: 50px;
		background-color: #333;
		border-radius: 3px;
		padding: 10px;
	}

	.error-display{
		color: rgb(218, 82, 82);
	}

	/* Form components */
	label{
		font-size: 16px;
		color: #fff;
		margin-bottom: 5px;
		display: inline-block;
		font-weight: 300;
	}

	input, select{
		border-radius: 3px;
		border: none;
		box-sizing: border-box;
		color: #fff;
		background-color: #333;
		font-size: 18px;
		transition: all 0.05s ease-in-out;
	}

	input, textarea, select{
		padding: 10px;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus-visible, textarea:focus-visible, select:focus-visible{
		outline: 2px solid #eee;
	}

	input[type=checkbox]{
		-webkit-appearance: none;
		appearance: none;
		width: 1.2em;
		height: 1.2em;
		transform: translateY(-0.075em);

		display: grid;
		place-content: center;
		margin: 0;
		cursor: pointer;

		transition: all 0.05s ease-in-out;
	}

	input[type=checkbox]::before{
		content: "";
		width: 0.8em;
		height: 0.8em;
		clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
		transform: scale(0);
		transform-origin: center;
		transition: 100ms transform ease-in-out;
		box-shadow: inset 1em 1em var(--form-control-color);
		background-color: #fff;
	}

	input[type="checkbox"]:checked::before {
		transform: scale(1);
	}

	input[type="checkbox"]:checked::before {
		transform: scale(1);
	}

	.checkbox-label{
		display: flex;
		align-items: center;
		grid-template-columns: 1em auto;
		gap: 0.6em;
	}

	input[type=range]{
		-webkit-appearance: none;
		height: 5px;
		margin: 0;
		padding: 0;
		background: #333;
		opacity: 0.7;
		-webkit-transition: .2s;
		transition: opacity .2s;
	}

	input[type=range]::-webkit-slider-thumb{
		-webkit-appearance: none;
		appearance: none;
		width: 1.2em;
		height: 1.2em;
		background-color: #fff;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.05s ease-in-out;
	}

	input[type=range]::-moz-range-thumb {
		appearance: none;
		width: 1.2em;
		height: 1.2em;
		/* transform: translateY(-0.075em); */
		background-color: #fff;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.05s ease-in-out;
	}

	button{
		background-color: #333;
		color: #fff;
		padding: 10px;
		border-radius: 3px;
		width: 100%;
		text-transform: uppercase;
		border: none;
		font-weight: 500;
		letter-spacing: 0.02857em;
		font-size: 0.875rem;
		cursor: pointer;
		font-family: 'Roboto', sans-serif;
		outline: #eee 0px solid;
		transition: all 0.05s ease-in-out;
	}

	button:active{
		background-color: #444;
	}


	button:focus-visible{
		outline: 2px solid #eee;
	}


	/* Utility */
	.monospace{
		font-family: 'Lucinda Console', Courier, monospace;
	}

	.row{
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		justify-content: center;
	}

	.vertical-center{
		display: grid;
		place-content: center start;
	}

	/* Scrollbar */
	*{
		scrollbar-width: thin;
	}

	::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	::-webkit-scrollbar-track {
		background: transparent;
	}

	::-webkit-scrollbar-thumb {
		background: #333; 
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #444; 
	}
</style>