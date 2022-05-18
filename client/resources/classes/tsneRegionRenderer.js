class TsneRegionRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera()

        this.plane = new THREE.Mesh(
            new THREE.CircularGeometry(1, 3),
            new THREE.ShaderMaterial()
        )
        this.material = this.plane.material

        this.loadMaterial()

    }

    async loadMaterial() {
        const frag = await (await fetch("../shaders/tsneRendererFrag.glsl")).text
        this.material.fragmentShader = frag;
    }

    update() {

    }
}