export default class WebGLw{
	gl: WebGL2RenderingContext;

	constructor(public canvas: HTMLCanvasElement){
		let glTmp = canvas.getContext('webgl2', {
			premultipliedAlpha: true
		});
		if(!glTmp) throw "WebGL is not supported in this browser!";
		this.gl = glTmp;

		glw = this;
		gl = this.gl;


		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.depthFunc(this.gl.LEQUAL);            // Near things obscure far things
		// We have to enable the depth test to prevent overlapping
        // triangles from being drawn all over the place.
        gl.enable(gl.DEPTH_TEST);

		// blending
		this.gl.enable(this.gl.BLEND);

        // A fragment passes the depth test if its depth is less than
        // the depth of the fragment in the framebuffer.
        gl.depthFunc(gl.LESS);

        // For efficiency, enable back face culling.
        // gl.enable(gl.CULL_FACE);

        // Cull back faces, not front. This is actually the default.
        gl.cullFace(gl.BACK);

        // A front face is defined by counter-clockwise orientation.
        // This is also the default, but we set it here for clarity.
        gl.frontFace(gl.CCW);
	}

	clearCanvas(){
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

		this.gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Clear to black, fully opaque
		this.gl.clearDepth(1.0);                 // Clear everything


		// Clear the canvas before we start drawing on it.
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}

	resize(){
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
	}

	drawTriangleStrip(numberOfVertices: number){
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, numberOfVertices);
	}
}

export let glw: WebGLw;
export let gl: WebGL2RenderingContext;