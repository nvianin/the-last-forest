const fontLoader = new THREE.FontLoader();

class TextRenderer {
    constructor() {
        this.font = fontLoader.load("./resources/fonts/SpaceGrotesk.ttf");

        this.texts = []
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
        })

        return new THREE.Mesh(
            geo,
            new THREE.MeshBasicMaterial({
                color: "white"
            })
        )
    }
}