const fontLoader = new THREE.FontLoader();
let font = false;
/* fontLoader.load("/client/node_modules/three/examples/fonts/helvetiker_regular.typeface.json", f => {
    log(f)
    font = f
}); */
fontLoader.load("./resources/fonts/Space_Grotesk_Light_Regular.json", f => {
    log(f)
    font = f
});
class TextRenderer {
    constructor() {

        this.texts = []

        /* const test = this.write("Space Grotesk Light Regular") */

        this.textMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: false,
            /* alphaTest: true,
            depthTest: false, */
        })
    }

    clear() {
        if (this.texts.length == 0) return -1;
        if (this.moveInterval) clearInterval(this.moveInterval);
        const _texts = this.texts.map(t => t);
        this.moveInterval = setInterval(() => {
            let dist = 0;
            const y_target = -90000;
            _texts.forEach(text => {
                text.position.y = Math.lerp(text.position.y, y_target, .15);
                dist += Math.abs(text.position.y - y_target);
            })
            /* this.textMaterial.opacity = Math.lerp(this.textMaterial.opacity, 0, .1); */
            /* dist += Math.abs(this.textMaterial.opacity - 0); */

            if (dist < .1) {
                clearInterval(this.moveInterval);
                /* this.textMaterial.opacity = 1; */
                _texts.forEach(t => {
                    app.scene.remove(t)
                    this.texts.splice(this.texts.indexOf(t), 1)
                })
            }
        }, 16);
    }

    write(string, size = 15) {
        if (font) {
            log(`${string} written using ${font.data.familyName}`)

            const y_base = -500;
            const y_target = 1000;

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
            mesh.position.y = y_base
            mesh.scale.multiplyScalar(100)

            this.texts.push(mesh)
            app.scene.add(mesh)

            const intro_interval = setInterval(() => {
                mesh.position.y = Math.lerp(mesh.position.y, y_target, .18);
                if (Math.abs(mesh.position.y - y_target) < 100) {
                    clearInterval(intro_interval);
                } else {
                    /* log(Math.abs(mesh.position.y - y_target)) */
                }
            })

            return mesh
        } else {
            throw new Error("Font not loaded")
        }
    }
}