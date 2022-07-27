#version 300 es
precision highp float;

uniform mat3 uTransformationMatrix;

in vec4 aVertexPosition;
out vec2 vTexCoord;

void main() {
	// vec3 transformed = uTransformationMatrix * aVertexPosition.xyw;
	// vTexCoord = transformed.xy;
	// gl_Position = aVertexPosition;

	vec3 transformed = uTransformationMatrix * aVertexPosition.xyw;
	vTexCoord = aVertexPosition.xy;
	gl_Position = vec4(transformed.xy, 0, 1);
}