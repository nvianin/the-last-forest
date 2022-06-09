uniform float time;
varying vec3 vPos;
varying float sin_time;
varying float vertex_random;

////

float t = time * 1. + rand(vPos.xy) * 1000.;
float opacity = sin_time;
/* opacity = 1.2 - gl_FragCoord.z; */

vec3 dark = vec3(0.2, 0.17, 0.11);
vec3 light = mix(vec3(0.9, 0.8, 0.25), vec3(.98, .54, .22), 1. - vertex_random);

gl_FragColor = vec4(mix(dark, light, vec3(sin_time)), opacity);
