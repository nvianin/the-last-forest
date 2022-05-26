#define TWO_PI 6.28318530718

uniform sampler2D tsne_map;
uniform float side;
uniform bool blur_pass;

void main() {
    vec2 st = gl_FragCoord.xy / side;
    vec4 result = vec4(0.);

    if(blur_pass) {
        int total = 8;
        for(float d = 1.; d < 16.; d++) {
            for(int i = 0; i < total; i++) {
                float t = float(i) / float(total) * TWO_PI;
                float x = st.x + cos(t) * (.0005 * d);
                float y = st.y + sin(t) * (.0005 * d);
                result += texture2D(tsne_map, vec2(x, y));
            }
        }

        result /= float(total) * 13.8;
        /* result = texture2D(tsne_map, st); */
        /* result = vec4(1., 0., 0., 1.); */

    } else {
        float x = st.x;
        float y = st.y;
        /* result = vec4(mix(texture2D(tsne_map, vec2(x, y)).xyz, normalize(texture2D(tsne_map, vec2(x, y)).xyz), .5), texture2D(tsne_map, vec2(x, y)).w); */
        result = mix(texture2D(tsne_map, vec2(x, y)), normalize(texture2D(tsne_map, vec2(x, y))), .6);
        /* result = texture2D(tsne_map, vec2(x, y)); */
        /* if(length(result) > 2.)
            result *= .2; */
        /* result = vec4(1., 0., 0., 1.); */
    }

    gl_FragColor = result;
    /* gl_FragColor = vec4(0.);
    gl_FragColor = vec4(1., 0., 0., 1.); */
}