import type WebGLw from "./WebGLw";

/*
	This class holds vertex attribute buffers and index buffers.
*/
export default class VertexArray{
	private vertexArrayObject: WebGLVertexArrayObject;
	private vertexBuffers: Map<number, WebGLBuffer> = new Map();
	private indexBuffer?: WebGLBuffer;
	private numIndices: number = 0;
	private numVertecies: number = 0;

	constructor(private glw: WebGLw){
		let vao = glw.gl.createVertexArray();
		if(!vao)throw "Can't create vertex array object.";
		this.vertexArrayObject = vao;
	}

	enable(){
		this.glw.gl.bindVertexArray(this.vertexArrayObject);
	}

	addVertexBuffer(location: number, data: Float32Array, numComponents: number, dynamic: boolean = false){
		this.numVertecies = data.length / numComponents;

		this.enable();

		let gl = this.glw.gl;

		let buffer: WebGLBuffer | undefined | null = this.vertexBuffers.get(location);
		if(!buffer){	
			buffer = gl.createBuffer();
		}
		if(!buffer) throw "Unable to create buffer.";

		this.vertexBuffers.set(location, buffer);

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(
			location,
			numComponents, // num compenents
			gl.FLOAT, // type
			false, // normalize
			0, // stride
			0 // offset
		);
	}

	getVertexBuffer(location: number){
		return this.vertexBuffers.get(location)
	}

	setIndexBuffer(data: Uint32Array, dynamic: boolean = false){
		this.enable();
		let gl = this.glw.gl;

		const buffer = gl.createBuffer();
		if(!buffer) throw "Unable to create buffer.";

		this.indexBuffer = buffer;
		this.numIndices = data.length;

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
	}

	getIndexBuffer(){
		return this.indexBuffer;
	}

	getNumIndcies(){
		return this.numIndices;
	}

	getNumVertecies(){
		return this.numVertecies;
	}
}