#version 300 es
precision highp float;

in vec2 vTexCoord;

out vec4 Color;

uniform vec4 uColor;



void main(){
	// vec2 uv = (vTexCoord.xy+1.0)/2.0;
	// Color = vec4(uv.x, uv.y, 0.9, 1.0);
	// if(abs(vTexCoord.x + 1.) < 0.1 || abs(vTexCoord.y - 1.) < 0.1){
	// 	Color = vec4(0.0, 0.0, 0.0, 1.0);
	// }
	Color = uColor;
}