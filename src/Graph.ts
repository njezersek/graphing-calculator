import { glw } from "gl-helpers/WebGLw";
import Shader from "gl-helpers/Shader";
import VertexArray from "gl-helpers/VertexArray";
import vertexCode from "shaders/grid-vertex.glsl";
import fragmentCode from "shaders/grid-fragment.glsl";
import { mat3 } from "gl-matrix";
import { Vec } from "Math";

export default class Graph{
	private program = new Shader(vertexCode, fragmentCode);
	private vertexArray = new VertexArray();

	constructor(){
		this.vertexArray.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			new Float32Array([0,0, 5,0, 0,7, 9,10]),
			2
		);

		this.vertexArray.setIndexBuffer(new Uint16Array([0,1,1,2,2,3,3,0]));
	}

	setPoints(V: Vec<2>[], E: [number, number, string, number][]){
		let vertices = new Float32Array(V.map(v => [v.x, v.y]).flat())
		this.vertexArray.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			vertices,
			2
		)
		
		let indices = new Uint16Array(E.map(e => [e[0], e[1]]).flat());

		console.log(`verices length: ${vertices.length}, indices length: ${indices.length}`);
		
		this.vertexArray.setIndexBuffer(indices);
	}


	render(transformationMatrix: mat3){
		this.program.enable();
		this.vertexArray.enable();

		this.program.setUniformMatrixFloat('uTransformationMatrix', transformationMatrix);
		glw.gl.drawElements(glw.gl.LINES, this.vertexArray.getNumIndcies(), glw.gl.UNSIGNED_SHORT, 0);
		// glw.gl.drawArrays(glw.gl.POINTS, 0, this.vertexArray.getNumVertecies());
	}
}