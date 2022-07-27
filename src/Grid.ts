import { glw } from "gl-helpers/WebGLw";
import Shader from "gl-helpers/Shader";
import VertexArray from "gl-helpers/VertexArray";
import vertexCode from "shaders/grid-vertex.glsl";
import fragmentCode from "shaders/grid-fragment.glsl";
import { mat3 } from "gl-matrix";

export default class Grid{
	private program = new Shader(vertexCode, fragmentCode);
	private vertexArray = new VertexArray();

	constructor(){
		this.vertexArray.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			new Float32Array([0,0, 10,0, 0,200, 100,200]),
			2
		);
	}

	render(transformationMatrix: mat3){
		this.program.enable();
		this.vertexArray.enable();

		this.program.setUniformMatrixFloat('uTransformationMatrix', transformationMatrix);
		glw.gl.drawArrays(glw.gl.TRIANGLE_STRIP, 0, 4);
	}
}