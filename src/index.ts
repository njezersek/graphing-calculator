let demo: HTMLElement;
let counter = 0;

function main(){
	console.log("Hello World");
	demo = document.getElementById('demo')!;
	tick();
}

function tick(){
	demo.innerHTML = `counter: ${counter++}`;
	setTimeout(tick, 1000);
}

document.addEventListener('DOMContentLoaded', main);