#define TWO_PI 6.28318530718

uniform sampler2D tsne_map;
uniform float side;
uniform bool blur_pass;

void main() {
    vec2 st = gl_FragCoord.xy / side;
    vec4 result = vec4(0.);
    /* if(blur_pass) { */
    int total = 32;
    for(float d = 0.; d < 32.; d++) {
        for(int i = 0; i < total; i++) {
            float x = st.x + cos(float(i) / float(total) * TWO_PI) * (.0014 * d);
            float y = st.y + sin(float(i) / float(total) * TWO_PI) * (.0014 * d);
            result += texture2D(tsne_map, vec2(x, y));
        }
    }

    result /= float(total) * 7.5;
    /* } */
    /* gl_FragColor = vec4(blur_pass); */
    gl_FragColor = result;
}