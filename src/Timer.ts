export default class Timer{
	private startTime: number;
	private endTime: number;
	private running = false;

	history: [number, number][] = [];
	historyDuration = 10_000;
	
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

		this.history.push([this.startTime, this.endTime]);

		this.history = this.history.filter((el, index) => (index == this.history.length-1) || (performance.now() - this.history[index+1][1] < this.historyDuration));
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