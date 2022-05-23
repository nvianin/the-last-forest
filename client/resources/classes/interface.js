const CONTROLLER_STATES = {
    WALKING: "WALKING",
    /* WALKING_ADVANCED: "WALKING_ADVANCED", */
    MAP: "MAP",
    PROMENADE: "PROMENADE",
    LERPING: "LERPING",
    FOCUSED: "FOCUSED"
}

class AppInterface {
    constructor() {

        this.state = CONTROLLER_STATES.MAP
        this.prevState = CONTROLLER_STATES.MAP
        this.nextState = CONTROLLER_STATES.MAP

        this.mapControls = new THREE.MapControls(app.camera, app.renderer.domElement);
        this.mapControls.maxPolarAngle = Math.HALF_PI * .8
        this.mapControls.minPolarAngle = .05
        this.mapControls.maxDistance = app.settings.draw_distance - app.settings.fog_offset;
        this.mapControls.minDistance = 1;
        this.mapControls.screenSpacePanning = false;
        this.mapControls.enabled = true;


        this.focused_mode = false;
        this.focused_tree = null;
        this.focused_target = new THREE.Object3D();
        this.rotation_dummy = new THREE.Object3D();
        this.focused_rotation_offset = Math.HALF_PI
        this.focused_angle = 0;
        this.focused_target_distance = 900;
        this.focused_target_height = 400;
        this.focused_backup = {
            mapControls: this.mapControls.enabled,
            position: app.camera.position.clone(),
            rotation: app.camera.rotation.clone(),
        }
        this.focused_lerping = false;

        this.simplex = new THREE.SimplexNoise()

        this.settings = {
            fov: {
                walk: 90,
                map: 50,
                focused: 50,
            },
            camera_ground_offset: 16,
            focused_fog_multiplier: .08
        }


        this.setupListeners();
        this.domController = new DomController(this.mapControls);

        this.raycaster = new THREE.Raycaster();
        this.target = new THREE.Object3D();
        this.target.target = this.findPointOnGround()
        this.map_transform = new THREE.Object3D();
        this.map_transform.position.copy(app.camera.position)
        this.map_transform.rotation.copy(app.camera.rotation)
        /* this.map_transform.zoom = parseFloat(this.domController.zoomSlider.dom.value) */
        this.map_transform.zoom = app.camera.position.y



        app.camera.fov = this.settings.fov.map;
        app.camera.updateProjectionMatrix()

        this.MAP_FOG = {
            near: app.settings.draw_distance - app.settings.fog_offset,
            far: app.settings.draw_distance
        }
        this.WALKING_FOG = {
            near: (app.settings.draw_distance - app.settings.fog_offset) * app.settings.walking_fog_multiplier,
            far: app.settings.draw_distance * app.settings.walking_fog_multiplier
        }
        this.target.fog = this.MAP_FOG
        this.target.fov = app.camera.fov;

        this.fatMat = new THREE.LineMaterial({
            color: 0xffffff,
            linewidth: 10,
            worldUnits: true,
            vertexColors: false,

            dashed: false,
            alphaToCoverage: true,
        })
        const linegeo = new THREE.LineGeometry()
        linegeo.setPositions(new THREE.SphereGeometry().attributes.position.array)
        this.fatTree = new THREE.Line2(
            linegeo,
            this.fatMat
        )
        this.fatTree.scale.multiplyScalar(1000)
        app.scene.add(this.fatTree);
    }
    setupListeners() {
        this.mouse = new THREE.Vector2;
        this.mouse_is_in_screen = true;
        this.mouse_target_element = null;
        window.addEventListener("pointermove", e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse_target_element = e.target
            if (this.focused_mode) {
                if (app.pointer_is_down) {
                    this.focused_angle += e.movementX * .003
                }
            } else {
                switch (this.state) {
                    case "WALKING":
                        if (document.pointerLockElement) {
                            app.camera.rotateOnWorldAxis(THREE.UP, -e.movementX * .003)
                            app.camera.rotateX(-e.movementY * 0.003)
                        }
                        break;
                }
            }
        })
        window.dispatchEvent(new Event("pointermove"))
        window.addEventListener("pointerup", e => {
            switch (this.state) {
                case "WALKING":
                    if (document.pointerLockElement) {
                        this.movement.set(0, 0, 0)
                        log("releasing lock")
                        document.exitPointerLock()
                    }
                    break;
            }
        })
        window.addEventListener("pointerdown", e => {
            switch (this.state) {
                case "WALKING":
                    setTimeout(() => {
                        if (e.target.id == "three" && app.pointer_is_down) {
                            log("locking pointer")
                            app.renderer.domElement.requestPointerLock()
                        }
                    }, 100)
                    break;

            }
        })
        window.addEventListener("wheel", e => {
            /* this.preventAutoRotate() */
            if (this.state == "MAP" && !this.focused_mode) {
                const zoom = this.mapControls.target.distanceTo(app.camera.position);
                this.domController.zoomSlider.targetValue = zoom;
                this.mapControls.minDistance = this.domController.zoomSlider.dom.min
                this.mapControls.maxDistance = this.domController.zoomSlider.dom.max
            } else if (this.focused_mode) {
                this.focused_target_distance = Math.clamp(this.focused_target_distance + e.deltaY, 300, 1500)
            }
            /* log(zoom) */
        })
        document.addEventListener("mouseleave", e => {
            /* log("mouseleave") */
            this.mouse_is_in_screen = false;
        })
        document.addEventListener("mouseenter", e => {
            /* f */
            this.mouse_is_in_screen = true;
        })

        this.movement = new THREE.Vector3();

        document.addEventListener("keydown", e => {
            switch (this.state) {
                case "WALKING":
                    if (document.pointerLockElement) {
                        switch (e.key) {
                            case "w":
                                this.movement.z = -1;
                                break;
                            case "a":
                                this.movement.x = -1;
                                break;
                            case "s":
                                this.movement.z = 1;
                                break;
                            case "d":
                                this.movement.x = 1
                                break;
                        }
                    }
                    break;
            }
        })
        document.addEventListener("keyup", e => {
            switch (this.state) {
                case "WALKING":
                    if (document.pointerLockElement) {
                        switch (e.key) {
                            case "w":
                                if (this.movement.z == -1) this.movement.z = 0;
                                break;
                            case "a":
                                if (this.movement.x == -1) this.movement.x = 0;
                                break;
                            case "s":
                                if (this.movement.z == 1) this.movement.z = 0;
                                break;
                            case "d":
                                if (this.movement.x == 1) this.movement.x = 0;
                                break;
                        }
                    }
                    break;
            }
        })
    }


    enter_focus(tree) {
        if (!this.focused_mode) this.focused_backup.mapControls = this.mapControls.enabled
        this.focused_mode = true;
        this.focused_tree = tree;
        this.mapControls.enabled = false;

        this.domController.focusInterface.container.style.opacity = 1;
        this.domController.focusInterface.container.style.left = "";
        this.domController.focusInterface.build(tree.userData.post);
        this.focused_backup.position.copy(app.camera.position)
        this.focused_backup.rotation.copy(app.camera.rotation)

        log(tree)
        this.fatTree.geometry.setPositions(tree.children[0].geometry.attributes.position.array)
        this.fatTree.position.copy(tree.position)
        this.fatTree.rotation.copy(tree.rotation)

        app.outlinePass.selectedObjects = [tree]
    }

    exit_focus() {
        app.outlinePass.selectedObjects = []
        this.domController.focusInterface.container.style.opacity = 0;
        this.domController.focusInterface.container.style.left = "-10000px";
        this.focused_lerping = true;

        if (this.focus_exit_interval) {
            clearInterval(this.focus_exit_interval)
        }
        this.focus_exit_interval = setInterval(() => {
            log("lerping exit focus")
            const dist =
                this.focused_backup.position.distanceTo(app.camera.position) +
                Math.abs(app.scene.fog.far - this.target.fog.far) +
                Math.abs(app.camera.fov - this.target.fov)
            if (dist > 1) {
                app.camera.position.lerp(this.focused_backup.position, .1);
                app.camera.rotation.copy(THREE.Euler.lerp(app.camera.rotation, this.focused_backup.rotation, .1))

                app.scene.fog.near = Math.lerp(app.scene.fog.near, this.target.fog.near, .1)
                app.scene.fog.far = Math.lerp(app.scene.fog.far, this.target.fog.far, .1)

                app.camera.fov = Math.lerp(app.camera.fov, this.target.fov, .1);
                app.camera.updateProjectionMatrix()
            } else {
                log(dist)
                clearInterval(this.focus_exit_interval)
                this.focused_mode = false;
                this.focused_lerping = false;
                this.mapControls.enabled = this.focused_backup.mapControls;
            }
        }, 16)
    }



    update(dt) {
        dt = Math.clamp(dt * 100, .01, .1)
        /* this.mapControls.target.y = 0; */
        this.domController.update()
        // Are we in focused mode ? Different state machines
        if (this.focused_mode && !this.focused_lerping) {
            app.camera.fov = Math.lerp(app.camera.fov, this.settings.fov.focused, dt);
            app.camera.updateProjectionMatrix()

            app.scene.fog.near = Math.lerp(app.scene.fog.near, (app.settings.draw_distance - app.settings.fog_offset) * this.settings.focused_fog_multiplier, dt)
            app.scene.fog.far = Math.lerp(app.scene.fog.far, app.settings.draw_distance * this.settings.focused_fog_multiplier, dt)

            /* log(app.scene.fog.near, app.scene.fog.far) */


            const tangent = new THREE.Vector3(
                Math.cos(app.time * .1 + this.focused_angle + Math.QUARTER_PI) * this.focused_target_distance * .5,
                0,
                Math.sin(app.time * .1 + this.focused_angle + Math.QUARTER_PI) * this.focused_target_distance * .5
            )


            this.focused_target.position
                .set(
                    Math.cos(app.time * .1 + this.focused_angle) * this.focused_target_distance,
                    2,
                    Math.sin(app.time * .1 + this.focused_angle) * this.focused_target_distance
                )
                .add(this.focused_tree.position)
                .add(new THREE.Vector3(0, this.focused_target_height + 100, 0))
                .add(tangent)

            this.rotation_dummy.position.copy(app.camera.position)
            this.rotation_dummy.rotation.set(0, (-app.time * .1 - this.focused_angle + this.focused_rotation_offset) % Math.TWO_PI, 0)

            /* log(app.camera.position, this.focused_target.position, dt) */
            app.camera.position.lerp(this.focused_target.position.clone(), dt * 1.5)
            /* log(app.camera.position) */
            /* app.camera.rotation.copy(THREE.Euler.lerp(app.camera.rotation, this.rotation_dummy.rotation, dt)) */
            app.camera.lookAt(this.focused_tree.position.clone().add(tangent).add(new THREE.Vector3(0, this.focused_target_height, 0)))

        } else if (!this.focused_mode) {

            app.scene.fog.near = Math.lerp(app.scene.fog.near, (app.settings.draw_distance - app.settings.fog_offset), dt)
            app.scene.fog.far = Math.lerp(app.scene.fog.far, app.settings.draw_distance, dt)


            // Update state according to dom inputs
            if (this.domController.currentState != this.nextState && this.nextState != "LERPING" && this.currentState != "LERPING") {
                this.changeState(this.domController.currentState);
                /* this.nextState = this.domController.currentState */
            }

            // Enter Next State initialization
            if (this.nextState != this.state) {
                this.state = this.nextState;
                log("Entering state " + this.nextState + " from " + this.prevState)
                switch (this.nextState) {
                    case CONTROLLER_STATES.WALKING:
                        this.target.state = "WALKING"
                        this.target.fov = this.settings.fov.walk
                        this.target.fog = this.WALKING_FOG
                        /* app.renderer.domElement.requestPointerLock() */

                        if (this.prevState == "MAP") {
                            this.map_transform.position.copy(app.camera.position);
                            this.map_transform.rotation.copy(app.camera.rotation)
                            this.map_transform.zoom = this.domController.getDistance()
                        }

                        if (this.prevState != "LERPING") {
                            if (this.prevState == "PROMENADE") {
                                this.target.position.copy(app.camera.position);
                                this.target.rotation.copy(app.camera.rotation);
                            } else {
                                this.target.position.copy(this.findPointOnGround())
                                this.target.rotation.set(0, 0, 0)
                            }
                            this.changeState("LERPING")
                        } else {
                            this.setFog(this.state)
                        }
                        this.mapControls.enabled = false;

                        break;
                    case CONTROLLER_STATES.MAP:
                        this.target.state = "MAP"
                        this.target.fov = this.settings.fov.map
                        this.target.fog = this.MAP_FOG
                        this.mapControls.enabled = true;

                        if (this.prevState != "LERPING") {
                            this.changeState("LERPING")
                        } else {
                            this.setFog(this.state)

                        }

                        break;
                    case CONTROLLER_STATES.PROMENADE:
                        this.target.state = "PROMENADE"
                        this.target.fov = this.settings.fov.walk
                        this.target.fog = this.WALKING_FOG
                        this.mapControls.enabled = false;

                        if (this.prevState == "MAP") {
                            this.map_transform.position.copy(app.camera.position);
                            this.map_transform.rotation.copy(app.camera.rotation)
                            this.map_transform.zoom = this.domController.getDistance()
                        }

                        if (this.prevState != "LERPING") {
                            if (this.prevState == "WALKING") {
                                this.target.position.copy(app.camera.position);
                                this.target.rotation.copy(app.camera.rotation);
                            } else {
                                this.target.position.copy(this.findPointOnGround())
                                this.target.rotation.set(0, 0, 0)
                            }
                            this.target.target = this.findPointOnGround();
                            this.changeState("LERPING")
                        } else {
                            this.setFog(this.state)

                        }

                        break;

                    case CONTROLLER_STATES.FOCUSED:
                        this.target.state = "FOCUSED"
                        this.target.fov = this.settings.fov.focused
                        this.mapControls.enabled = false;

                        if (this.prevState != "LERPING") {
                            this.target.position.copy(app.camera.position);
                            this.target.rotation.copy(app.camera.rotation)
                        } else {
                            this.target.position.copy()
                        }


                        break;
                    case CONTROLLER_STATES.LERPING:


                        this.mapControls.enabled = false;
                        break;
                }
            }

            // Current state behaviour
            let dist;
            switch (this.state) {
                case CONTROLLER_STATES.WALKING:
                    if (this.mouse_is_in_screen && this.mouse_target_element == app.renderer.domElement) {
                        // Simple fps controller
                        if (!document.pointerLockElement) {
                            const x = (this.mouse.x - innerWidth / 2) / innerWidth;
                            if (Math.abs(x) > .4) {
                                app.camera.rotateOnWorldAxis(THREE.UP, x * -.02)
                            }
                            const y = (this.mouse.y - innerHeight / 2) / innerHeight;

                            if (Math.abs(y) > .35) {
                                /* app.camera.rotateX(y * -.02) */
                                app.camera.translateZ(y * 2)
                            }
                            /* log(x, y) */
                        } else {
                            // Advanced fps controller
                            app.camera.translateZ(this.movement.z * .5);
                            app.camera.translateX(this.movement.x * .5);
                        }

                        // Cast to ground
                        this.raycaster.set(app.camera.position, THREE.DOWN)
                        const i = this.raycaster.intersectObject(app.ground)
                        if (i.length > 0) {
                            app.camera.position.y = i[0].point.y + this.settings.camera_ground_offset
                        }


                    }
                    break;


                case CONTROLLER_STATES.MAP:
                    this.map_transform.position.copy(app.camera.position)
                    this.map_transform.rotation.copy(app.camera.rotation)
                    /* if (app.camera.position.distanceTo(this.mapControls.target) > 2) {
                        this.mapControls.enabled = false;
                        app.camera.position.lerp(this.mapControls.target, dt)
                    } else {
                    } */
                    this.mapControls.update()
                    break;

                case CONTROLLER_STATES.PROMENADE:
                    let x = this.simplex.noise(app.clock.getElapsedTime() * .01, app.camera.position.x * .01);
                    x = Math.clamp(x, -.2, .2);
                    app.camera.rotateOnWorldAxis(THREE.UP, x * -.02)
                    /* const y = this.simplex.noise(app.camera.position.y * .1, app.clock.getElapsedTime() * .01); */
                    const y = .2;
                    app.camera.translateZ(-y)
                    app.camera.position.lerp(this.target.target.clone().normalize().add(app.camera.position), .1);
                    if (app.camera.position.distanceTo(this.target.target) < 2) {
                        this.target.target = this.findPointOnGround();
                    }

                    /* log(x, y) */
                    this.raycaster.set(app.camera.position, THREE.DOWN)
                    const i = this.raycaster.intersectObject(app.ground)
                    if (i.length > 0) {
                        app.camera.position.y = i[0].point.y + this.settings.camera_ground_offset
                    }
                    break;

                    // State-to-state lerping
                case CONTROLLER_STATES.LERPING:
                    log("lerping to state " + this.target.state)
                    switch (this.target.state) {
                        case "WALKING":
                            app.camera.position.lerp(this.target.position, dt)
                            app.camera.rotation.copy(THREE.Euler.lerp(app.camera.rotation, this.target.rotation, dt))

                            dist = app.camera.position.distanceTo(this.target.position)

                            break;
                        case "MAP":
                            app.camera.position.lerp(this.map_transform.position, dt)
                            app.camera.rotation.copy(THREE.Euler.lerp(app.camera.rotation, this.map_transform.rotation, dt))

                            /* const currentzoom = this.domController.getDistance()
                            this.domController.setZoomLevel(Math.lerp(currentzoom, this.map_transform.zoom, .1)); */

                            dist = this.map_transform.position.distanceTo(app.camera.position) /* + Math.abs(currentzoom - this.map_transform.zoom) */ ;

                            break;


                        case "PROMENADE":
                            this.target.rotation.set(0, 0, 0)
                            app.camera.position.lerp(this.target.position, dt);
                            app.camera.rotation.copy(THREE.Euler.lerp(app.camera.rotation, this.target.rotation, dt))

                            dist = app.camera.position.distanceTo(this.target.position)
                    }
                    if (dist < 2) {
                        this.changeState(this.target.state)
                    } else {
                        log(dist)
                    }
                    app.scene.fog.near = Math.lerp(app.scene.fog.near, this.target.fog.near, dt)
                    app.scene.fog.far = Math.lerp(app.scene.fog.far, this.target.fog.far, dt)
                    app.camera.fov = Math.lerp(app.camera.fov, this.target.fov, dt);
                    app.camera.updateProjectionMatrix()
                    /* this.domController.setZoomLevel(this.domController.getDistance()) */
                    /* this.mapControls.update() */
                    break;
            }
        }
    }

    changeState(state) {
        this.prevState = this.state;
        this.nextState = state;
        switch (state) {
            case "WALKING":

                break;
            case "MAP":

                break;
            case "PROMENADE":

                break;
        }
    }

    setFog(state) {
        switch (state) {
            case "WALKING":
                app.scene.fog.near = (app.settings.draw_distance - app.settings.fog_offset) * app.settings.walking_fog_multiplier
                app.scene.fog.far = app.settings.draw_distance * app.settings.walking_fog_multiplier
                break;
            case "MAP":
                app.scene.fog.near = app.settings.draw_distance - app.settings.fog_offset
                app.scene.fog.far = app.settings.draw_distance
                break;
            case "PROMENADE":
                app.scene.fog.near = (app.settings.draw_distance - app.settings.fog_offset) * app.settings.walking_fog_multiplier
                app.scene.fog.far = app.settings.draw_distance * app.settings.walking_fog_multiplier
                break;
            case "FOCUSED":
                app.scene.fog.near = (app.settings.draw_distance - app.settings.fog_offset) * app.settings.walking_fog_multiplier
                app.scene.fog.far = app.settings.draw_distance * app.settings.walking_fog_multiplier
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

    findPointOnGround() {
        this.raycaster.set(new THREE.Vector3(
            (Math.random() * 2 - 1) * 384,
            10,
            (Math.random() * 2 - 1) * 384,
        ), new THREE.Vector3(0, -1, 0))

        const intersects = this.raycaster.intersectObject(app.ground)
        if (intersects[0]) {
            /* log(intersects[0]) */
            return intersects[0].point.add(new THREE.Vector3(0, this.settings.camera_ground_offset, 0))
        } else {
            return this.findPointOnGround()
        }
    }

    generatePath() {
        /* const generatedCurve = 
        const count = Math.random() * 12;
        for (let i = 0; i < count;i++) */
    }
}