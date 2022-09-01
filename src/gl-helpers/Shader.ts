import type WebGLw from "./WebGLw";

/*
 This class handles compiling shader and interacting with its variables
*/
export default class Shader{
	private vertexShader: WebGLShader;
	private fragmentShader: WebGLShader;
	private program: WebGLProgram;
	private uniformLocationCache: Map<string, WebGLUniformLocation | null> = new Map();
	private attributeLocationCache: Map<string, number> = new Map();
	
	constructor(private glw: WebGLw, private vertexCode: string, private fragmentCode: string){
		let gl = this.glw.gl;
		this.vertexShader = this.loadShader(gl.VERTEX_SHADER, vertexCode);
		this.fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fragmentCode);

		// Create the shader program
		const shaderProgram = gl.createProgram();
		if(!shaderProgram) throw "Unable to initialize the shader program.";
		this.program = shaderProgram;

		gl.attachShader(shaderProgram, this.vertexShader);
		gl.attachShader(shaderProgram, this.fragmentShader);
		gl.linkProgram(shaderProgram);
		gl.deleteShader(this.vertexShader);
		gl.deleteShader(this.fragmentShader);

		// If creating the shader program failed, alert
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			throw 'Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram);
		}

		// get number of active attributes (not optimzed out by the compiler)
        const activeAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < activeAttributes; i++) {
            // for each active attribute get its name and location
            const info = gl.getActiveAttrib(this.program, i)!;
            this.attributeLocationCache.set(info.name, gl.getAttribLocation(this.program, info.name));
        }

		// console.log(this.attributeLocationCache);
	}

	private loadShader(type: number, source: string) {
		let gl = this.glw.gl;
		const shader = gl.createShader(type);
		if(!shader) throw "Unable to create shader.";
	
		// Send the source to the shader object
		gl.shaderSource(shader, source);
	
		// Compile the shader program
		gl.compileShader(shader);
	
		// See if it compiled successfully
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			let error = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw 'An error occurred compiling the shaders: ' + error;
		}
	
		return shader;
	}

	enable(){
		this.glw.gl.useProgram(this.program);
	}

	setUniformVectorFloat(name: string, data: Float32List){
		let location = this.getUniformLocation(name);

		if(data.length == 1){
			this.glw.gl.uniform1fv(location, data);
		}
		else if(data.length == 2){
			this.glw.gl.uniform2fv(location, data);
		}
		else if(data.length == 3){
			this.glw.gl.uniform3fv(location, data);
		}
		else if(data.length == 4){
			this.glw.gl.uniform4fv(location, data);
		}
		else{
			throw "setUniformVectorFloat called with wrong data length";
		}
	}

	setUniformMatrixFloat(name: string, data: Float32List, transpose?: boolean){
		let location = this.getUniformLocation(name);

		if(!transpose) transpose = false;
		if(data.length == 4){
			this.glw.gl.uniformMatrix2fv(location, transpose, data);
		}
		else if(data.length == 9){
			this.glw.gl.uniformMatrix3fv(location, transpose, data);
		}
		else if(data.length == 16){
			this.glw.gl.uniformMatrix4fv(location, transpose, data);
		}
		else{
			throw "setUniformMatrixFloat called with wrong data length";
		}
	}

	getUniformLocation(name: string){
		let location = this.uniformLocationCache.get(name) as WebGLUniformLocation | undefined | null;
		if(location === undefined){
			location = this.glw.gl.getUniformLocation(this.program, name);
			this.uniformLocationCache.set(name, location);
		}
		return location;
	}

	getAttributeLocation(name: string){
		let id = this.attributeLocationCache.get(name);
		if(id === undefined){
			throw `Can't find attribute '${name}'';`
		}
		return id;
	}
}