#version 300 es
precision highp float;

uniform mat3 uTransformationMatrix;

in vec4 aVertexPosition;
out vec2 vTexCoord;

void main() {
	vec3 transformed = uTransformationMatrix * aVertexPosition.xyw;
	vTexCoord = transformed.xy;
	gl_Position = aVertexPosition;
}