// Noise functions from https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83

// Simplex 2D noise
//

vec3 permute2(vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise2(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute2(permute2(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

uniform float time;
in float random;
in float random_size;
out float vert_random;

////

float t = sin(time * .0001);

vec3 pos = vec3(snoise2(vec2(position.x + 1., position.y + 1.) + t), snoise2(vec2(position.y + 1., position.x + 1.) + t), snoise2(vec2(position.z + 1., position.x + 1.) + t));
/* if(vert_random > .5) {
pos.z *= 30.;
} else if(vert_random < .3) {
pos.z *= .5;
} */
/* if(pos < 0.) {
pos += 10000.;
} */

gl_Position = projectionMatrix * modelViewMatrix * vec4(pos * 100., 1.);
gl_PointSize = clamp((1. - random_size) * 6., 1., 3.) * (1. - distance(position.xxx, vec3(0.)) / 14000.);

vert_random = random;