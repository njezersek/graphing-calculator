import { glw } from "gl-helpers/WebGLw";
import Shader from "gl-helpers/Shader";
import VertexArray from "gl-helpers/VertexArray";
import vertexCode from "shaders/grid-vertex.glsl";
import fragmentCode from "shaders/grid-fragment.glsl";
import { mat3 } from "gl-matrix";

export default class Graph{
	private program = new Shader(vertexCode, fragmentCode);
	private vertexArray = new VertexArray();
	private debugGridVAO = new VertexArray();

	constructor(){
		this.vertexArray.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			new Float32Array([]),
			2
		);

		this.vertexArray.setIndexBuffer(new Uint32Array([]));

		this.debugGridVAO.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			new Float32Array([]),
			2
		);

		this.debugGridVAO.setIndexBuffer(new Uint32Array([]));
	}

	setPoints(vertices: Float32Array, edges: Uint32Array){
		this.vertexArray.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			vertices,
			2
		)

		console.log(`verices length: ${vertices.length}, indices length: ${edges.length}`);
		
		this.vertexArray.setIndexBuffer(edges);
	}

	setDebugPoints(vertices: Float32Array, edges: Uint32Array){
		this.debugGridVAO.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			vertices,
			2
		)

		console.log(`verices length: ${vertices.length}, indices length: ${edges.length}`);

		this.debugGridVAO.setIndexBuffer(edges);
	}


	render(transformationMatrix: mat3){
		this.program.enable();
		this.vertexArray.enable();

		this.program.setUniformMatrixFloat('uTransformationMatrix', transformationMatrix);
		this.program.setUniformVectorFloat('uColor', [1,1,0,1]);
		glw.gl.drawElements(glw.gl.LINES, this.vertexArray.getNumIndcies(), glw.gl.UNSIGNED_INT, 0);
		glw.gl.drawArrays(glw.gl.POINTS, 0, this.vertexArray.getNumVertecies());
		
		this.program.enable();
		this.debugGridVAO.enable();
		this.program.setUniformVectorFloat('uColor', [0.3,0.4,0.5,0.7]);
		this.program.setUniformMatrixFloat('uTransformationMatrix', transformationMatrix);
		glw.gl.drawElements(glw.gl.LINES, this.debugGridVAO.getNumIndcies(), glw.gl.UNSIGNED_INT, 0);
	}
}