import { glw, gl } from 'gl-helpers/WebGLw';

/*
 This class handles compiling shader and interacting with its variables
*/
export default class Shader{
	private vertexShader: WebGLShader;
	private fragmentShader: WebGLShader;
	private program: WebGLProgram;
	private uniformLocationCache: Map<string, WebGLUniformLocation | null> = new Map();
	private attributeLocationCache: Map<string, number> = new Map();
	
	constructor(private vertexCode: string, private fragmentCode: string){
		this.vertexShader = this.loadShader(glw.gl.VERTEX_SHADER, vertexCode);
		this.fragmentShader = this.loadShader(glw.gl.FRAGMENT_SHADER, fragmentCode);

		// Create the shader program
		const shaderProgram = glw.gl.createProgram();
		if(!shaderProgram) throw "Unable to initialize the shader program.";
		this.program = shaderProgram;

		glw.gl.attachShader(shaderProgram, this.vertexShader);
		glw.gl.attachShader(shaderProgram, this.fragmentShader);
		glw.gl.linkProgram(shaderProgram);
		glw.gl.deleteShader(this.vertexShader);
		glw.gl.deleteShader(this.fragmentShader);

		// If creating the shader program failed, alert
		if (!glw.gl.getProgramParameter(shaderProgram, glw.gl.LINK_STATUS)) {
			throw 'Unable to initialize the shader program: ' + glw.gl.getProgramInfoLog(shaderProgram);
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
		const shader = glw.gl.createShader(type);
		if(!shader) throw "Unable to create shader.";
	
		// Send the source to the shader object
		glw.gl.shaderSource(shader, source);
	
		// Compile the shader program
		glw.gl.compileShader(shader);
	
		// See if it compiled successfully
		if (!glw.gl.getShaderParameter(shader, glw.gl.COMPILE_STATUS)) {
			let error = glw.gl.getShaderInfoLog(shader);
			glw.gl.deleteShader(shader);
			throw 'An error occurred compiling the shaders: ' + error;
		}
	
		return shader;
	}

	enable(){
		glw.gl.useProgram(this.program);
	}

	setUniformVectorFloat(name: string, data: Float32List){
		let location = this.getUniformLocation(name);

		if(data.length == 1){
			glw.gl.uniform1fv(location, data);
		}
		else if(data.length == 2){
			glw.gl.uniform2fv(location, data);
		}
		else if(data.length == 3){
			glw.gl.uniform3fv(location, data);
		}
		else if(data.length == 4){
			glw.gl.uniform4fv(location, data);
		}
		else{
			throw "setUniformVectorFloat called with wrong data length";
		}
	}

	setUniformMatrixFloat(name: string, data: Float32List, transpose?: boolean){
		let location = this.getUniformLocation(name);

		if(!transpose) transpose = false;
		if(data.length == 4){
			glw.gl.uniformMatrix2fv(location, transpose, data);
		}
		else if(data.length == 9){
			glw.gl.uniformMatrix3fv(location, transpose, data);
		}
		else if(data.length == 16){
			glw.gl.uniformMatrix4fv(location, transpose, data);
		}
		else{
			throw "setUniformMatrixFloat called with wrong data length";
		}
	}

	getUniformLocation(name: string){
		let location = this.uniformLocationCache.get(name) as WebGLUniformLocation | undefined | null;
		if(location === undefined){
			location = glw.gl.getUniformLocation(this.program, name);
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