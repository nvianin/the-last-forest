precision highp float;

#define PI 3.1415926538

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    float dis = 1.;
    float blur = 1.;
    float width = .1;
    vec3 lineColor = vec3(1.);

    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.x *= u_resolution.x / u_resolution.y;
    vec2 o = uv + vec2(-.5, -0.5);
    o *= 10.;
    float angle = atan(o.y, o.x);
    float l = length(o);
    float offset = l + (angle / (2. * PI)) * dis;
    float circles = mod(offset - u_time, dis);
    vec3 col = (smoothstep(circles - blur, circles, width) - smoothstep(circles, circles + blur, width)) * lineColor;

    gl_FragColor = vec4(vec3(circles), 1.);
}