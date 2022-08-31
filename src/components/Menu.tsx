export const Menu = () => {
	return <>
		<section>
			<h1>Implicit function plotter</h1>
		</section>
		<div class="settings">
			<section>
				<label for="expression-input">Function expression:</label>
				<input id="expression-input" type="text" class="monospace" />
				<pre class="error-display"></pre>
			</section>
			<section>
				<div class="row">
					<div class="vertical-center">
						<label class="checkbox-label">
							<input type="checkbox" id="auto-calculate-checkbox" />
							Auto-calculate
						</label>
					</div>
					<div>
						<button id="calculate-button">calculate</button>
					</div>
				</div>
			</section>
			<div class="divider"></div>
			<section>
				<label>Quad tree debug draw </label>
				<select id="quad-tree-display-select">
					<option value="hide">Hide tree structure</option>
					<option value="show-all">Show full tree structure</option>
					<option value="show-leaves">Show only leaves</option>
				</select>
			</section>
			<div class="divider"></div>
			<section>
				<div class="row">
					<label>Max tree depth</label>
					<label style="text-align: end" id="max-depth-display">12</label>
				</div>
				<input type="range" min="1" max="16" step="1" id="max-depth-input" value="12" />
			</section>
			<section>
				<label>Zero exclusion algorithm</label>
				<select id="zero-exclusion-algorithm-select">
					<option value="IntervalAritmetic">Interval arithmetic</option>
					<option value="SignIntervalCombo">Sign difference + interval arithmetic</option>
					<option value="SignDifference">Sign difference</option>
					<option value="Disabled">Ignore</option>
				</select>
			</section>
			<section>
				<label>Zero finding algorithm</label>
				<select id="zero-finding-algorithm-select">
					<option value="RegulaFalsi">Regula Falsi</option>
					<option value="Bisection">Bisection</option>
					<option value="Interpolation">Interpolation</option>
					<option value="Middle">Midpoint</option>
				</select>
			</section>
			<div class="divider"></div>
			<section>
				<label>Computation duration</label>
				<div class="duration-display" id="duration-display">
				</div>
			</section>
		</div>
	</>
}