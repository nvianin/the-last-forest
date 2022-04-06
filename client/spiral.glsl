precision mediump float;
#define TWO_PI 6.28318532
#define PI 3.1415926538
#define HALF_PI 1.57079633

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy - .5;
    st.x *= u_resolution.x / u_resolution.y;

    float edge = .05;
    float margin = .003;

    float d = distance(st, vec2(0., 0.));
    d += atan(st.x, st.y) * 1. + PI;
    d /= TWO_PI;
    /* d = mod(d, .1); */

    float color = smoothstep(edge + margin, edge, d);
    color *= smoothstep(edge - margin, edge + margin, d);

    gl_FragColor = vec4(vec3(color), 1.);
    /* gl_FragColor = vec4(1.); */
}