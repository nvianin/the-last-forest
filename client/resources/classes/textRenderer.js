const fontLoader = new THREE.FontLoader();
let font = false;
/* fontLoader.load("/client/node_modules/three/examples/fonts/helvetiker_regular.typeface.json", f => {
    log(f)
    font = f
}); */
fontLoader.load("./resources/fonts/Space Grotesk Light_Regular.json", f => {
    log(f)
    font = f
});
class TextRenderer {
    constructor() {

        this.texts = []

        const test = this.write("Space Grotesk Light Regular")

        this.textMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: false,
            /* alphaTest: true,
            depthTest: false, */
        })
    }

    clear() {
        this.texts.forEach(t => {
            app.scene.remove(t)
        })
        this.texts = []
    }

    write(string, size = 15) {
        if (font) {
            log(`${string} written using ${font.data.familyName}`)
            const geo = new THREE.TextGeometry(string, {
                font: font,
                size: size,
                height: .1,
                curveSegments: 3,
                bevelEnabled: false
            })
            const mesh = new THREE.Mesh(
                geo,
                this.textMaterial
            )
            mesh.rotation.x = -Math.PI / 2
            mesh.position.y = 1000;
            mesh.scale.multiplyScalar(100)

            this.texts.push(mesh)
            app.scene.add(mesh)

            return mesh
        } else {
            throw new Error("Font not loaded")
        }
    }
}