#define TWO_PI 6.28318530718

uniform sampler2D tsne_map;
uniform float side;
uniform bool blur_pass;

void main() {
    vec2 st = gl_FragCoord.xy / side;
    vec4 result = vec4(0.);

    if(blur_pass) {
        int total = 32;
        for(float d = 0.; d < 16.; d++) {
            for(int i = 0; i < total; i++) {
                float x = st.x + cos(float(i) / float(total) * TWO_PI) * (.0014 * d);
                float y = st.y + sin(float(i) / float(total) * TWO_PI) * (.0014 * d);
                result += texture2D(tsne_map, vec2(x, y));
            }
        }

        result /= float(total) * 12.;
    } else {
        float x = 1. - st.y;
        float y = st.x;
        result = vec4(mix(texture2D(tsne_map, vec2(x, y)).xyz, normalize(texture2D(tsne_map, vec2(x, y)).xyz), .3), texture2D(tsne_map, vec2(x, y)).w);
        result = texture2D(tsne_map, vec2(x, y));
        /* if(length(result) > 2.)
            result *= .2; */
    }

    gl_FragColor = result;
    /* gl_FragColor = vec4(1., 0., 0., 1.); */
}