import { glw } from 'gl-helpers/WebGLw';

/*
	This class holds vertex attribute buffers and index buffers.
*/
export default class VertexArray{
	private vertexArrayObject: WebGLVertexArrayObject;
	private vertexBuffers: Map<number, WebGLBuffer> = new Map();
	private indexBuffer?: WebGLBuffer;
	private numIndices: number = 0;
	private numVertecies: number = 0;

	constructor(){
		let vao = glw.gl.createVertexArray();
		if(!vao)throw "Can't create vertex array object.";
		this.vertexArrayObject = vao;
	}

	enable(){
		glw.gl.bindVertexArray(this.vertexArrayObject);
	}

	addVertexBuffer(location: number, data: Float32Array, numComponents: number){
		this.numVertecies = data.length / numComponents;

		this.enable();

		const buffer = glw.gl.createBuffer();
		if(!buffer) throw "Unable to create buffer.";

		this.vertexBuffers.set(location, buffer);

		glw.gl.bindBuffer(glw.gl.ARRAY_BUFFER, buffer);
		glw.gl.bufferData(glw.gl.ARRAY_BUFFER, data, glw.gl.STATIC_DRAW);
		glw.gl.enableVertexAttribArray(location);
		glw.gl.vertexAttribPointer(
			location,
			numComponents, // num compenents
			glw.gl.FLOAT, // type
			false, // normalize
			0, // stride
			0 // offset
		);
	}

	getVertexBuffer(location: number){
		return this.vertexBuffers.get(location)
	}

	setIndexBuffer(data: Uint16Array){
		this.enable();

		const buffer = glw.gl.createBuffer();
		if(!buffer) throw "Unable to create buffer.";

		this.indexBuffer = buffer;
		this.numIndices = data.length;

		glw.gl.bindBuffer(glw.gl.ELEMENT_ARRAY_BUFFER, buffer);
		glw.gl.bufferData(glw.gl.ELEMENT_ARRAY_BUFFER, data, glw.gl.STATIC_DRAW);
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