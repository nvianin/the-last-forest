const CONTROLLER_STATES = {
    WALKING: "WALKING",
    MAP: "MAP",
    PROMENADE: "PROMENADE",
}

class AppInterface {
    constructor() {

        this.state = CONTROLLER_STATES.MAP
        this.prevState = CONTROLLER_STATES.MAP
        this.nextState = CONTROLLER_STATES.MAP

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
    update() {
        if (this.nextState != this.state) {
            this.state = this.nextState;
            switch (this.nextState) {
                case CONTROLLER_STATES.PROMENADE:
                    break;
                case CONTROLLER_STATES.PROMENADE:
                    break;
                case CONTROLLER_STATES.PROMENADE:
                    break;
            }
        }
        switch ()
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