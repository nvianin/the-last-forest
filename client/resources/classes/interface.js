const CONTROLLER_STATES = {
    WALKING: "WALKING",
    WALKING_ADVANCED: "WALKING_ADVANCED",
    MAP: "MAP",
    PROMENADE: "PROMENADE",
    LERPING: "LERPING"
}


class AppInterface {
    constructor() {

        this.UP = new THREE.Vector3(0, 1, 0)

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

        this.target = new THREE.Object3D();
        this.map_transform = new THREE.Object3D();
        this.raycaster = new THREE.Raycaster();
    }
    setupListeners() {
        this.mouse = new THREE.Vector2;
        window.addEventListener("pointermove", e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        })
        window.dispatchEvent(new Event("pointermove"))
        window.addEventListener("pointerup", e => {
            /* this.preventAutoRotate() */
        })
        window.addEventListener("pointerdown", e => {

        })
        window.addEventListener("wheel", e => {
            /* this.preventAutoRotate() */
            const zoom = this.mapControls.target.distanceTo(app.camera.position);
            this.domController.zoomSlider.targetValue = zoom;
            this.mapControls.minDistance = this.domController.zoomSlider.dom.min
            this.mapControls.maxDistance = this.domController.zoomSlider.dom.max
            /* log(zoom) */
        })
    }



    update() {
        /* this.mapControls.target.y = 0; */
        this.domController.update()
        // Update state according to dom inputs
        if (this.domController.currentState != this.nextState && this.nextState != "LERPING") {
            this.changeState(this.domController.currentState);
        }

        // Next state initialization
        if (this.nextState != this.state) {
            this.state = this.nextState;
            log("Entering state " + this.nextState)
            switch (this.nextState) {
                case CONTROLLER_STATES.WALKING:
                    this.target.state = "WALKING"
                    /* app.renderer.domElement.requestPointerLock() */

                    if (this.prevState != "LERPING") {
                        this.target.position.copy(this.findPointOnGround())
                        this.target.rotation.set(0, 0, 0)
                        this.changeState("LERPING")
                    }
                    this.mapControls.enabled = false;

                    break;
                case CONTROLLER_STATES.MAP:
                    this.target.state = "MAP"
                    this.mapControls.enabled = true;

                    if (this.prevState != "LERPING") {
                        this.target.position.copy(this.map_transform.position)
                        this.changeState("LERPING")
                    }

                    break;
                case CONTROLLER_STATES.PROMENADE:
                    this.target.state = "PROMENADE"
                    this.mapControls.enabled = true;
                    break;
                case CONTROLLER_STATES.LERPING:
                    log("Prev state:" + this.prevState)
                    if (this.prevState == "MAP") {
                        this.map_transform.copy(this.mapControls.target.position);
                        this.map_transform.zoom = this.domController.getDistance()
                    }
                    this.mapControls.enabled = false;
                    break;
            }
        }

        // Current state behaviour
        let dist;
        switch (this.state) {
            case CONTROLLER_STATES.WALKING:
                const x = (this.mouse.x - innerWidth / 2) / innerWidth;
                app.camera.rotateOnWorldAxis(this.UP, x * .02)

                log(x)
                break;

            case CONTROLLER_STATES.MAP:
                this.mapControls.update()
                break;

            case CONTROLLER_STATES.PROMENADE:
                break;

            case CONTROLLER_STATES.LERPING:
                switch (this.target.state) {
                    case "WALKING":
                        app.camera.position.lerp(this.target.position, .1)
                        app.camera.rotation.
                        dist = app.camera.position.distanceTo(this.target.position)
                        if (dist < 2) {
                            this.changeState(this.target.state)
                        } else {
                            log(dist)
                        }
                        break;
                    case "MAP":
                        this.mapControls.target.lerp(this.map_transform.position, .01)
                        this.domController.setZoomLevel(this.map_transform.zoom)
                        dist = this.mapControls.target.distanceTo(this.map_transform.position)
                        if (dist < 2) {
                            this.changeState(this.target.state)
                        } else {
                            log(dist)
                        }
                        break;
                }
                /* this.domController.setZoomLevel(this.domController.getDistance()) */
                /* this.mapControls.update() */
                break;
        }
    }

    changeState(state) {
        this.prevState = this.state;
        this.nextState = state;
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

    findPointOnGround() {
        this.raycaster.set(new THREE.Vector3(
            (Math.random() * 2 - 1) * 384,
            10,
            (Math.random() * 2 - 1) * 384,
        ), new THREE.Vector3(0, -1, 0))

        const intersects = this.raycaster.intersectObject(app.ground)
        if (intersects[0]) {
            /* log(intersects[0]) */
            return intersects[0].point.add(new THREE.Vector3(0, 8, 0))
        } else {
            return this.findPointOnGround()
        }
    }
}