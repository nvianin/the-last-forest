uniform float time;
uniform vec3 camera;
varying vec3 vPos;
varying float sin_time;
varying float vertex_random;
varying float distance_factor;

////
if(dot(gl_PointCoord - .5, gl_PointCoord - .5) > .25) {
discard;
} else {
float t = time * 1. + rand(vPos.xy) * 1000.;
float opacity = sin_time;
/* opacity = 1.2 - gl_FragCoord.z; */

vec3 dark = vec3(0.2, 0.17, 0.11);
vec3 light = mix(vec3(0.9, 0.8, 0.25), vec3(.9, .2, .22), /* 1. - */ vertex_random);

gl_FragColor = vec4(mix(dark, light, vec3(sin_time)), opacity * distance_factor);
/* gl_FragColor = vec4(vec3(distance_factor), 1.); */
}