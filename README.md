# Implicit function plotter

## Structure of the program

The program consists of two parts:
- The [backend](/backend) receives an implicit function expression in plain text, parses it, and computes its contour. It is then passed to the frontend in form of vertices and edges. The backend is written in Rust and compiled to Web Assembly for maximum performance.
- The [frontend](/src) handles user input and displays the results from the backend on HTML canvas using WebGL. It is written in TypeScript.

## Build instructions

- __Install the dependencies__:
	```
	npm install
	```
	_This should be done only once. If the process fails for some reason, delete the `node_modules` folder and start again._

- __Run live development server:__
	```
	npm start
	```

- __Build to `\dist`:__
	```
	npm run build
	```
	_The contents of `dist` folder can than be placed on any web server._

## Recommended extensions for VS Code
- __Shader languages support for VS Code__  \
	Syntax highlighting and code completion for shader languages. \
	[`slevesque.shader`](https://marketplace.visualstudio.com/items?itemName=slevesque.shader)
- __GitLens — Git supercharged__ \
	GitLens supercharges the Git capabilities built into Visual Studio Code. \
	[`eamodio.gitlens`](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
- __Rust Extension Pack__ \
  	Contains _rust-analyzer_, _crates_ and _Better TOML_. \
	[`swellaby.rust-pack`](https://marketplace.visualstudio.com/items?itemName=swellaby.rust-pack)