import App from './App';

function init(){
	console.log("test")
	// new App();	

	import('../backend/pkg').then((module) => {
		module.greet();
		module.greet_with_name("Nejc Jezersek");
	})
}

window.addEventListener('load', init);