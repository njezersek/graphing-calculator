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
			new Float32Array([0,0, 1,0, 0,1, 1,1]),
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

	setPoints(vertices: Float32Array, edges: Uint16Array){
		this.vertexArray.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			vertices,
			2
		)

		console.log(`verices length: ${vertices.length}, indices length: ${edges.length}`);
		
		this.vertexArray.setIndexBuffer(edges);
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