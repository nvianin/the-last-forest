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

        this.side = 2 ** 64;
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
        this.renderer.setRenderTarget(this.framebuffer)
        this.renderer.render(this.scene, this.camera)
        this.renderer.copyFramebufferToTexture(new THREE.Vector2, this.frametex)
        this.renderer.setRenderTarget(null)
    }
}