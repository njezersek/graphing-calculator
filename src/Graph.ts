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
	private debugGridVAO = new VertexArray();

	constructor(){
		this.vertexArray.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			new Float32Array([0,0, 5,0, 0,7, 9,10]),
			2
		);

		this.vertexArray.setIndexBuffer(new Uint16Array([0,1,1,2,2,3,3,0]));

		this.debugGridVAO.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			new Float32Array([ 1,1, 1,-1, -1,-1, -1,1 ]),
			2
		);

		this.debugGridVAO.setIndexBuffer(new Uint16Array([0,1,1,2,2,3,3,0]));
	}

	setPoints(V: Vec<2>[], E: [number, number, string, number][], Vdebug: Vec<2>[], Edebug: [number, number, string, number][]){
		let vertices = new Float32Array(V.map(v => [v.x, v.y]).flat())
		this.vertexArray.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			vertices,
			2
		)
		
		let indices = new Uint16Array(E.map(e => [e[0], e[1]]).flat());

		console.log(`verices length: ${vertices.length}, indices length: ${indices.length}`);
		
		this.vertexArray.setIndexBuffer(indices);


		let verticesDebug = new Float32Array(Vdebug.map(v => [v.x, v.y]).flat())
		this.debugGridVAO.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			verticesDebug,
			2
		)

		let indicesDebug = new Uint16Array(Edebug.map(e => [e[0], e[1]]).flat());

		console.log(`verices length: ${verticesDebug.length}, indices length: ${indicesDebug.length}`);

		this.debugGridVAO.setIndexBuffer(indicesDebug);
	}


	render(transformationMatrix: mat3){
		this.program.enable();
		this.vertexArray.enable();

		this.program.setUniformMatrixFloat('uTransformationMatrix', transformationMatrix);
		this.program.setUniformVectorFloat('uColor', [0,0,0,1]);
		glw.gl.drawElements(glw.gl.LINES, this.vertexArray.getNumIndcies(), glw.gl.UNSIGNED_SHORT, 0);
		// glw.gl.drawArrays(glw.gl.POINTS, 0, this.vertexArray.getNumVertecies());
		
		this.program.enable();
		this.debugGridVAO.enable();
		this.program.setUniformVectorFloat('uColor', [0.5,0.5,1,1]);
		this.program.setUniformMatrixFloat('uTransformationMatrix', transformationMatrix);
		glw.gl.drawElements(glw.gl.LINES, this.debugGridVAO.getNumIndcies(), glw.gl.UNSIGNED_SHORT, 0);
	}
}