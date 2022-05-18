class TsneRegionRenderer {
    constructor(renderer, posts) {
        this.renderer = renderer;
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera()

        this.posts = Object.values(posts);

        this.plane = new THREE.Mesh(
            new THREE.CircleGeometry(1, 3),
            new THREE.ShaderMaterial({
                uniforms: {
                    posts: {
                        value: new Float32Array(this.posts.length * 2)
                    },
                    posts_colors: {
                        value: new Uint8Array(this.posts.length * 3)
                    }
                },

            })
        )
        this.material = this.plane.material

        this.side = 64 ** 2;
        this.framebuffer = new THREE.WebGLRenderTarget(this.side, this.side, {
            depthBuffer: false,
            stencilBuffer: false
        })
        this.frametex = new THREE.FramebufferTexture(this.side, this.side, THREE.RGBAFormat)

        this.loadMaterial()


        this.update();

    }

    async loadMaterial() {
        const frag = await (await fetch("./resources/shaders/tsneRendererFrag.glsl")).text
        this.material.fragmentShader = frag;
    }

    update() {
        let missing = 0;
        for (let i = 0; i < this.posts.length; i++) {
            if (this.posts[i].tsne_coordinates && Object.keys(treeTypes).includes(this.posts[i].flair)) {
                this.material.uniforms.posts.value[i * 2] = this.posts[i].tsne_coordinates.x
                this.material.uniforms.posts.value[i * 2 + 1] = this.posts[i].tsne_coordinates.y

                this.material.uniforms.posts_colors.value[i * 3] = treeColors[this.posts[i].flair].color.r
                this.material.uniforms.posts_colors.value[i * 3 + 1] = treeColors[this.posts[i].flair].color.g
                this.material.uniforms.posts_colors.value[i * 3 + 2] = treeColors[this.posts[i].flair].color.b
            } else {
                missing++
            }
        }
        log(missing + " missing tsne coordinates.")



        this.renderer.setRenderTarget(this.framebuffer)
        this.renderer.render(this.scene, this.camera)
        this.renderer.copyFramebufferToTexture(new THREE.Vector2, this.frametex)
        this.renderer.setRenderTarget(null)
    }
}