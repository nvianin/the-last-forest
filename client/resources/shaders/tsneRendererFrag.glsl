#define MAX_POST_COUNT 512

uniform int postcount;
uniform vec2 posts[MAX_POST_COUNT];
uniform vec3 posts_colors[MAX_POST_COUNT];

void main() {
    vec2 st = gl_FragCoord.xy / pow(64., 2.);
    vec4 result = vec4(0.);
    int total = 0;
    /* for(int i = 0;i < postcount;i++){
        if (posts[i * 2] != 0){
            
        }
    } */
    /* result /= float(total); */

    /* float circle = distance(); */
    gl_FragColor = vec4(1., 0., 1., 1.);
}