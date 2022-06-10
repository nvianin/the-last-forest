const fontLoader = new THREE.FontLoader();

class TextRenderer {
    constructor() {
        this.font = fontLoader.load("/client/node_modules/three/examples/fonts/helvetiker_regular.typeface.json", font => {
            log(font)
            this.font = font
        });
        /* this.font = fontLoader.load("./resources/fonts/Space Grotesk Light_Regular.json", font => {
            log(font)
            this.font = font
        }); */

        this.texts = []

        const test = this.write("hallo")
        test.material.wireframe = true;
        app.scene.add(test)
        test.scale.multiplyScalar(100)
        this.texts.push(test)
    }

    clear() {
        this.texts.forEach(t => {
            app.scene.remove(t)
        })
        this.texts = []
    }

    write(string) {
        const geo = new THREE.TextGeometry(string, {
            font: this.font,
            size: 80,
            height: 5,
            curveSegments: 12,
            bevelEnabled: false
        })

        return new THREE.Mesh(
            geo,
            new THREE.MeshBasicMaterial({
                color: "white"
            })
        )
    }
}