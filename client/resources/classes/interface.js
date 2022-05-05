const CONTROLLER_STATES = {
    WALKING: "WALKING",
    WALKING_ADVANCED: "WALKING_ADVANCED",
    MAP: "MAP",
    PROMENADE: "PROMENADE",
}

class AppInterface {
    constructor() {


        this.state = CONTROLLER_STATES.MAP
        this.prevState = CONTROLLER_STATES.MAP
        this.nextState = CONTROLLER_STATES.MAP

        this.mapControls = new THREE.MapControls(app.camera, app.renderer.domElement);
        this.mapControls.maxPolarAngle = Math.HALF_PI * .8
        this.mapControls.maxDistance = 1000;
        this.mapControls.minDistance = 1;
        this.mapControls.screenSpacePanning = false;

        this.setupListeners();
        this.domController = new DomController(this.mapControls);
    }
    setupListeners() {
        window.addEventListener("pointermove", e => {

        })
        window.addEventListener("pointerup", e => {
            /* this.preventAutoRotate() */
        })
        window.addEventListener("wheel", e => {
            /* this.preventAutoRotate() */
            const zoom = this.mapControls.target.distanceTo(app.camera.position);
            this.domController.zoomSlider.targetValue = zoom;
            this.mapControls.minDistance = this.domController.zoomSlider.dom.min
            this.mapControls.maxDistance = this.domController.zoomSlider.dom.max
            /* log(zoom) */
        })
        window.addEventListener("pointerdown", e => {

        })
    }



    update() {
        /* this.mapControls.target.y = 0; */
        this.domController.update()

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
                this.mapControls.update()
                break;
            case CONTROLLER_STATES.PROMENADE:
                break;
        }
    }

    preventAutoRotate() {
        this.mapControls.autoRotate = false;
        if (this.autoRotateTimeout) {
            clearTimeout(this.autoRotateTimeout);
        }
        this.autoRotateTimeout = setTimeout(() => {
            this.mapControls.autoRotate = true;
        }, 2000);
    }
}