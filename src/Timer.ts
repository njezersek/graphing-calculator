export default class Timer{
	private startTime: number;
	private endTime: number;
	private running = false;
	
	constructor(){
		this.startTime = 0;
		this.endTime = 0;
	}
	
	start(){
		this.startTime = performance.now();
		this.running = true;
	}
	
	stop(){
		this.endTime = performance.now();
		this.running = false;
	}
	
	getTime(){
		if(this.running){
			return performance.now() - this.startTime;
		}
		else{
			return this.endTime - this.startTime;
		}
	}

	isRunning(){
		return this.running;
	}
	
	reset(){
		this.startTime = 0;
		this.endTime = 0;
		this.running = false;
	}
}