#define MAX_POST_COUNT 1

uniform sampler2D tsne_map;
uniform float side;

void main() {
    vec2 st = gl_FragCoord.xy / side;
    /* for(int i = 0;i < postcount;i++){
        if (posts[i * 2] != 0){
            
        }
    } */
    /* result /= float(total); */

    /* float circle = distance(); */
    gl_FragColor = vec4(1., 0., 1., 1.);
    gl_FragColor = texture2D(tsne_map, st);
}