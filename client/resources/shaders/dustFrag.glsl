uniform float time;
varying vec3 vPos;
varying float sin_time;

////

float t = time * 1. + rand(vPos.xy) * 1000.;
float opacity = sin_time;

vec3 dark = vec3(0.2, 0.17, 0.11);
vec3 light = vec3(0.77, 0.76, 0.25);

gl_FragColor = vec4(mix(dark, light, vec3(sin_time)), opacity);
