<script lang="ts">
	import type GraphController from "~/GraphController";
	import PerformanceDisplay from "~/components/PerformanceDisplay.svelte";

	import hide from "~/img/hide.png";

	export let controller: GraphController;

	let {
		expression, maxDepth, showDebug, zeroExclusionAlgorithm, 
		zeroFindingAlgorithm, autoCalculate, expressionError, timingDisplay
	} = controller;

	let input: HTMLInputElement;
	let selectionStart = 0;
	let selectionEnd = 0;

	function storeSelection(e: FocusEvent){
		selectionStart = input.selectionStart || 0;
		selectionEnd = input.selectionEnd || 0;
	}

	function input_string(s: string){
		$expression = $expression.slice(0, selectionStart) + s + $expression.slice(selectionEnd);

		selectionStart += s.length;
		selectionEnd = selectionStart;
	}

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
			<input bind:value={$expression} on:blur={storeSelection} bind:this={input} id="expression-input" type="text" class="monospace" />
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
				<option value="Newton">Newton</option>
				<option value="Interpolation">Interpolation</option>
				<option value="Middle">Midpoint</option>
			</select>
		</section>
		<div class="divider"></div>
		<section>
			<label for="duration-display">Computation duration</label>
			<div class="duration-display" id="duration-display">
				<PerformanceDisplay timer={controller.timer}/>
				<div class="duration-text">
					{$timingDisplay}
				</div>
			</div>
		</section>
		<section>
			<label for="">Supported functions</label>
			<div class="function"><div class="badge" on:click={() => input_string("+")}>+</div> Add</div>
			<div class="function"><div class="badge" on:click={() => input_string("-")}>-</div> Substract</div>
			<div class="function"><div class="badge" on:click={() => input_string("*")}>*</div> Multiply</div>
			<div class="function"><div class="badge" on:click={() => input_string("/")}>/</div> Divide</div>
			<div class="function"><div class="badge" on:click={() => input_string("^")}>^</div> Power</div>
			<div class="function"><div class="badge" on:click={() => input_string("sin()")}>sin</div> Sinus</div>
			<div class="function"><div class="badge" on:click={() => input_string("asin()")}>asin</div> Arcus Sinus</div>
			<div class="function"><div class="badge" on:click={() => input_string("cos()")}>cos</div> Cosinus</div>
			<div class="function"><div class="badge" on:click={() => input_string("acos()")}>acos</div> Arcus Cosinus</div>
			<div class="function"><div class="badge" on:click={() => input_string("tan()")}>tan</div> Tangens</div>
			<div class="function"><div class="badge" on:click={() => input_string("atan()")}>atan</div> Arcus Tangens</div>
			<div class="function"><div class="badge" on:click={() => input_string("sinh()")}>sinh</div> Hyperbolic Sinus</div>
			<div class="function"><div class="badge" on:click={() => input_string("asinh()")}>asinh</div> Hyperbolic Arcus Sinus</div>
			<div class="function"><div class="badge" on:click={() => input_string("cosh()")}>cosh</div> Hyperbolic Cosinus</div>
			<div class="function"><div class="badge" on:click={() => input_string("acosh()")}>acosh</div> Hyperbolic Arcus Cosinus</div>
			<div class="function"><div class="badge" on:click={() => input_string("tanh()")}>tanh</div> Hyperbolic Tangens</div>
			<div class="function"><div class="badge" on:click={() => input_string("atanh()")}>atanh</div> Hyperbolic Arcus Tangens</div>
			<div class="function"><div class="badge" on:click={() => input_string("exp()")}>exp</div> Exponential</div>
			<div class="function"><div class="badge" on:click={() => input_string("ln()")}>ln</div> Natural Logarithm</div>
			<div class="function"><div class="badge" on:click={() => input_string("log2()")}>log2</div> Logarithm base 2</div>
			<div class="function"><div class="badge" on:click={() => input_string("log10()")}>log10</div> Logarithm base 10</div>
			<div class="function"><div class="badge" on:click={() => input_string("||")}>||</div> Absolute value</div>
			<div class="function"><div class="badge" on:click={() => input_string("sign()")}>sign</div> Sign</div>
			<div class="function"><div class="badge" on:click={() => input_string("round()")}>round</div> Round</div>
			<div class="function"><div class="badge" on:click={() => input_string("floor()")}>floor</div> Floor</div>
			<div class="function"><div class="badge" on:click={() => input_string("ceil()")}>ceil</div> Ceiling</div>
			<div class="function"><div class="badge" on:click={() => input_string("min()")}>min</div> Minimum</div>
			<div class="function"><div class="badge" on:click={() => input_string("max()")}>max</div> Maximum</div>
		</section>
		<section>
			<label for="">Examples</label>
			<div class="example" on:click={() => $expression = "x^2 + y^2 = 1"}>x^2 + y^2 = 1</div>
			<div class="example" on:click={() => $expression = "max(|x|, |y|) = 1"}>max(|x|, |y|) = 1</div>
			<div class="example" on:click={() => $expression = "x^2 + y^2 + sin(10*x^3) = 1"}>x^2 + y^2 + sin(10*x^3) = 1</div>
			<div class="example" on:click={() => $expression = "x^2+(1.2*y-|0.9*x|^(2/3))^2=1"}>x^2+(1.2*y-|0.9*x|^(2/3))^2=1</div>
			<div class="example" on:click={() => $expression = "sin(x)=cos(y)-0.1"}>sin(x)=cos(y)-0.1</div>
		</section>

		<section>
			<label for="">Export to LaTeX</label>
			<button on:click={() => navigator.clipboard.writeText(controller.renderToLatex())}>Copy to clipboard</button>
		</section>
	</div>
</div>

<style lang="scss">

	/* set some variables */
	:root{
		--text-color: #fff;
		--panel-background-color: #181818;
		--accent-color: #25435f; /* used for header background */
		--accent-color-light: #274c68;
		--field-color: #333;
		--field-outline-color: #eee;
		--field-active-color: #444;
	}

	@media (prefers-color-scheme: light) {
		:root{
			--text-color: #000;
			--panel-background-color: #fafafa;
			--accent-color: #4987c2; /* used for header background */
			--accent-color-light: #5fa1d4;
			--field-color: #dedede;
			--field-outline-color: #333;
			--field-active-color: #ccc;
		}
	}

	.container {
		width: 100%;
		height: 100%;
		overflow: hidden;
		background-color: var(--panel-background-color);
		color: var(--text-color);
		display: flex;
		flex-direction: column;
	}

	header{
		padding: 5px 15px;
		font-family: 'Roboto Slab';
		background-color: var(--accent-color);
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.9);
		display: flex;
		justify-content: space-between;
		align-items: center;

		h1{
			font-size: 20px;
			margin: 0;
			outline: none;
			color: #fff;
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
			background-color: var(--accent-color);

			&:active{
				background-color: var(--accent-color-light);
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
		background-color: var(--field-color);
		border-radius: 3px;
		position: relative;
		overflow: hidden;

		.duration-text{
			position: absolute;
			top: 5px;
			right: 5px;
			font-family: 'Courier New', Courier, monospace;
			color: var(--text-color);
		}
	}

	.error-display{
		color: rgb(218, 82, 82);
		white-space: pre-wrap;
	}

	/* Form components */
	label{
		font-size: 16px;
		color: var(--text-color);
		margin-bottom: 5px;
		display: inline-block;
		font-weight: 300;
	}

	input, select{
		border-radius: 3px;
		border: none;
		box-sizing: border-box;
		color: var(--text-color);
		background-color: var(--field-color);
		font-size: 18px;
		transition: all 0.05s ease-in-out;
	}

	input, textarea, select{
		padding: 10px;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus-visible, textarea:focus-visible, select:focus-visible{
		outline: 2px solid var(--field-outline-color);
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
		background-color: var(--text-color);
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
		background: var(--field-color);
		opacity: 0.7;
		-webkit-transition: .2s;
		transition: opacity .2s;
	}

	input[type=range]::-webkit-slider-thumb{
		-webkit-appearance: none;
		appearance: none;
		width: 1.2em;
		height: 1.2em;
		background-color: var(--text-color);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.05s ease-in-out;
	}

	input[type=range]::-moz-range-thumb {
		appearance: none;
		width: 1.2em;
		height: 1.2em;
		/* transform: translateY(-0.075em); */
		background-color: var(--text-color);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.05s ease-in-out;
	}

	button{
		background-color: var(--field-color);
		color: var(--text-color);
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
		outline: var(--field-outline-color) 0px solid;
		transition: all 0.05s ease-in-out;
	}

	button:active{
		background-color: var(--field-active-color);
	}


	button:focus-visible{
		outline: 2px solid var(--field-outline-color);
	}


	.function{
		display: flex;
		align-items: center;
		margin: 5px 0;
	}

	.badge{
		background-color: var(--field-color);
		color: var(--text-color);
		padding: 5px;
		border-radius: 3px;
		margin-right: 10px;
		min-width: 50px;
		text-align: center;
		cursor: pointer;
	}

	.example{
		background-color: var(--field-color);
		color: var(--text-color);
		padding: 10px;
		border-radius: 3px;
		margin: 5px 0;
		font-family: 'Lucinda Console', Courier, monospace;
		cursor: pointer;
	}

	@media (prefers-color-scheme: light) {
		header {
			box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
		}
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
		background: var(--field-color); 
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: var(--field-active-color); 
	}
</style>