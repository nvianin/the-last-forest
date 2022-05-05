const CONTROLLER_STATES = {
    ""
}

class AppInterface {
    constructor() {
        this.orbitControls = new THREE.OrbitControls(app.camera, app.renderer.domElement);

        this.setupListeners()
    }
    setupListeners() {
        window.addEventListener("pointermove", e => {

        })
        window.addEventListener("pointerup", e => {
            this.preventAutoRotate()
        })
        window.addEventListener("wheel", e => {
            this.preventAutoRotate()
        })
        window.addEventListener("pointerdown", e => {

        })
    }

    preventAutoRotate() {
        this.orbitControls.autoRotate = false;
        if (this.autoRotateTimeout) {
            clearTimeout(this.autoRotateTimeout);
        }
        this.autoRotateTimeout = setTimeout(() => {
            this.orbitControls.autoRotate = true;
        }, 2000);
    }
}