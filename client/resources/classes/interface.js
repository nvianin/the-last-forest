const CONTROLLER_STATES = {
    WALKING: "WALKING",
    WALKING_ADVANCED: "WALKING_ADVANCED",
    MAP: "MAP",
    PROMENADE: "PROMENADE",
}

class AppInterface {
    constructor() {

        this.domController = new DomController();

        this.state = CONTROLLER_STATES.MAP
        this.prevState = CONTROLLER_STATES.MAP
        this.nextState = CONTROLLER_STATES.MAP

        this.orbitControls = new THREE.OrbitControls(app.camera, app.renderer.domElement);

        this.setupListeners();
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

        // Next state initialization
        if (this.nextState != this.state) {
            this.state = this.nextState;
            switch (this.nextState) {
                case CONTROLLER_STATES.WALKING:
                    break;
                case CONTROLLER_STATES.MAP:

                    break;
                case CONTROLLER_STATES.PROMENADE:
                    break;
            }
        }

        // Current state behaviour
        switch (this.state) {
            case CONTROLLER_STATES.WALKING:
                break;
            case CONTROLLER_STATES.MAP:
                this.orbitControls.update()
                break;
            case CONTROLLER_STATES.PROMENADE:
                break;
        }
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