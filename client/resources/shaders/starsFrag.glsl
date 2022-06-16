uniform float time;
in float vert_random;

////
if(dot(gl_PointCoord - .5, gl_PointCoord - .5) > .25) {
discard;
} else {

vec3 one = vec3(1, .01, .01);
vec3 two = vec3(1, .7, 0);
vec3 three = vec3(.9, 1, .4);
vec3 four = vec3(.4, 1, .9);
vec3 five = vec3(.2, .5, .9);

vec3 lerp_1 = mix(one, two, vert_random * 2.);
vec3 lerp_2 = mix(four, five, (vert_random - .5) * 2.);
vec3 color = mix(lerp_1, lerp_2, 1. - vert_random);
/* color = lerp_2; */
gl_FragColor = vec4(color, (sin(time * (vert_random / 1.4 + .2) + 1.) / 2. + vert_random * 400.));

}