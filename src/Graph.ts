import Shader from "~/gl-helpers/Shader";
import VertexArray from "~/gl-helpers/VertexArray";
import vertexCode from "~/shaders/grid-vertex.glsl";
import fragmentCode from "~/shaders/grid-fragment.glsl";
import type { mat3 } from "gl-matrix";
import type WebGLw from "./gl-helpers/WebGLw";

export default class Graph{
	private program: Shader;
	private vertexArray: VertexArray;
	private debugGridVAO: VertexArray;

	public graphColor = [1,1,0,1];
	public debugGridColor = [0.3,0.4,0.5,0.7];

	// graph data
	private vertices = new Float32Array([]);
	private edges = new Uint32Array([]);
	private debug_vertices = new Float32Array([]);
	private debug_edges = new Uint32Array([]);
	
	constructor(private glw: WebGLw){
		this.program = new Shader(this.glw, vertexCode, fragmentCode);
		this.vertexArray = new VertexArray(this.glw);
		this.debugGridVAO = new VertexArray(this.glw);

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

		this.vertices = vertices;
		this.edges = edges;

		// console.log(`verices length: ${vertices.length}, indices length: ${edges.length}`);
		
		this.vertexArray.setIndexBuffer(edges);
	}

	setDebugPoints(vertices: Float32Array, edges: Uint32Array){
		this.debugGridVAO.addVertexBuffer(
			this.program.getAttributeLocation('aVertexPosition'),
			vertices,
			2
		)

		this.debug_vertices = vertices;
		this.debug_edges = edges;

		// console.log(`verices length: ${vertices.length}, indices length: ${edges.length}`);

		this.debugGridVAO.setIndexBuffer(edges);
	}


	render(transformationMatrix: mat3){
		let gl = this.glw.gl;
		this.program.enable();
		this.vertexArray.enable();

		this.program.setUniformMatrixFloat('uTransformationMatrix', transformationMatrix);
		this.program.setUniformVectorFloat('uColor', this.graphColor);
		gl.drawElements(gl.LINES, this.vertexArray.getNumIndcies(), gl.UNSIGNED_INT, 0);
		gl.drawArrays(gl.POINTS, 0, this.vertexArray.getNumVertecies());
		
		this.program.enable();
		this.debugGridVAO.enable();
		this.program.setUniformVectorFloat('uColor', this.debugGridColor);
		this.program.setUniformMatrixFloat('uTransformationMatrix', transformationMatrix);
		gl.drawElements(gl.LINES, this.debugGridVAO.getNumIndcies(), gl.UNSIGNED_INT, 0);
	}

	renderToLatex(transformationMatrix: mat3){

		function to_latex(raw_vertices: Float32Array, raw_edges: Uint32Array, style: string = "thick"){
			let s = `\\draw[${style}]`;
			let vertices: number[][] = [];
			let edges: number[][] = [];
			for(let i = 0; i < raw_vertices.length; i+=2){
				let v = [raw_vertices[i], raw_vertices[i+1]];
				vertices.push(v);
			}
			for(let i = 0; i < raw_edges.length; i+=2){
				let e = [raw_edges[i], raw_edges[i+1]];
				edges.push(e);
			}
	
	
			for(let e of edges){
				let p1 = vertices[e[0]];
				let p2 = vertices[e[1]];
	
				s += ` (${p1[0].toFixed(4)}, ${p1[1].toFixed(4)}) -- (${p2[0].toFixed(4)}, ${p2[1].toFixed(4)})`;
			}
	
			s += ";\n";
	
			return s;
		}

		let s = to_latex(this.vertices, this.edges);
		s += to_latex(this.debug_vertices, this.debug_edges);
		return s;
	}
}