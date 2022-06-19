
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

//	Simplex 4D Noise 
            //	by Ian McEwan, Ashima Arts
            //
vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}
float permute(float x) {
    return floor(mod(((x * 34.0) + 1.0) * x, 289.0));
}
vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}
float taylorInvSqrt(float r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) {
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p, s;

    p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;

    return p;
}

float snoise(vec4 v) {
    const vec2 C = vec2(0.138196601125010504, // (5 - sqrt(5))/20  G4
    0.309016994374947451); // (sqrt(5) - 1)/4   F4
                // First corner
    vec4 i = floor(v + dot(v, C.yyyy));
    vec4 x0 = v - i + dot(i, C.xxxx);

                // Other corners

                // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
    vec4 i0;

    vec3 isX = step(x0.yzw, x0.xxx);
    vec3 isYZ = step(x0.zww, x0.yyz);
                //  i0.x = dot( isX, vec3( 1.0 ) );
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;

                //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;

    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

                // i0 now contains the unique values 0,1,2,3 in each channel
    vec4 i3 = clamp(i0, 0.0, 1.0);
    vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
    vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

                //  x0 = x0 - 0.0 + 0.0 * C 
    vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
    vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
    vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
    vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

                // Permutations
    i = mod(i, 289.0);
    float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute(permute(permute(permute(i.w + vec4(i1.w, i2.w, i3.w, 1.0)) + i.z + vec4(i1.z, i2.z, i3.z, 1.0)) + i.y + vec4(i1.y, i2.y, i3.y, 1.0)) + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
                // Gradients
                // ( 7*7*6 points uniformly over a cube, mapped onto a 4-octahedron.)
                // 7*7*6 = 294, which is close to the ring size 17*17 = 289.

    vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);

    vec4 p0 = grad4(j0, ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

                // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt(dot(p4, p4));

                // Mix contributions from the five corners
    vec3 m0 = max(0.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;
    return 49.0 * (dot(m0 * m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))) + dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4))));

}

vec3 snoiseAtPos(vec3 pos, float sc, float t, vec3 wind) {
    float x = snoise(vec4((vec3(pos.x, pos.y, pos.z) + wind * t) * sc, t + 1.));
    float y = snoise(vec4((vec3(pos.y, pos.x, pos.z) + wind * t) * sc, t + 3.));
    float z = snoise(vec4((vec3(pos.z, pos.y, pos.x) + wind * t) * sc, t + 7.));
    return vec3(x, y, z);
}

uniform float time;
uniform vec3 camera;
uniform float pixelSize;
attribute float random;
varying vec3 vPos;
varying float sin_time;
varying float vertex_random;
varying float distance_factor;

////

vertex_random = random;

float sc = 10. * random;
float time_scale = .02;
/* float t = time * .8 * random + random * 1000.; */
float t = pixelSize;

vec3 pos = position;

/* if(vertex_random > 0.5) {
pos.z *= 10.;
} else if(vertex_random > .8) {
pos.z *= 30.;
} */

/* vec3 noise = vec3(snoise((position.xy * sc) + (time * time_scale)), snoise((position.yz * sc) + (time * time_scale)), snoise((position.zx * sc) + (time * time_scale))); */
vec3 wind = snoiseAtPos(position * 10., .01, time * .2, vec3(.4, .6, 0.));
wind *= position.y * .1;
wind *= .4;

pos += wind;

if(vertex_random > .8) {
pos.z += 10000. * sin(time);
}

/* vec3 movement = vec3(snoise2(position.xy + time * .001), snoise2(position.yz + time * .001), snoise2(position.zx + time * .001)) * (.001 * time);
movement.z *= .01;
pos += movement; */

gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + wind, 1.0);
vPos = gl_Position.xyz;

distance_factor = 1. - distance(camera, vPos) / 340000.;
distance_factor = clamp(distance_factor, 0., 1.);

sin_time = (sin(t) + (sin(t * 3.) / 3.) + (sin(t * 5.) / 5.) + 1.) / 2.;
/* gl_PointSize = sin_time; */
/* gl_PointSize *= distance_factor;
gl_PointSize = clamp(gl_PointSize, 0., 4.) * pixelSize; */
gl_PointSize = distance_factor * pixelSize * 1. * sin_time;
/* gl_PointSize = 4. * pixelSize; */