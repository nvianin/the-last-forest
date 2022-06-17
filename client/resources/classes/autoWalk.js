// AutoWalk class, used to walk around the map automatically.
class AutoWalk {
    constructor(camera) {
        this.camera = camera;

        this.direction = camera.rotation.y;
        this.speed = 0;
        this.maxSpeed = .14;

        this.vistas = [];
        this.maxVistas = 32;

        /* this.vistaBufferingInterval = setInterval(() => {
           
        }, 100); */

        this.currentVista;
    }

    walk(dt) {
        // Get new vista if needed.
        if (this.vistas.length < this.maxVistas) {
            /* this.currentVista = this.vistas.pop(); */
            for (let i = 0; i < this.maxVistas - this.vistas.length; i++) {
                this.findNextVista();
            }
            /* let failCount = 0;
            while (!this.findNextVista()) {
                failCount++;
                if (failCount > 1000) {
                    throw new Error("No vista found after " + failCount + " tries.");
                    break;
                }
            } */
            /* this.vistas.splice(0, 1) */
        } else {
            this.vistas.sort((a, b) => {
                return (
                    a.position.distanceTo(this.camera.position) -
                    b.position.distanceTo(this.camera.position)
                )
            })
            this.currentVista = this.vistas[0];

            const angle = Math.atan2(
                this.camera.position.x - this.currentVista.position.x,
                this.camera.position.z - this.currentVista.position.z
            ) + Math.TWO_PI;
            this.direction = Math.lerp(this.direction, angle, dt);

            const dist = this.currentVista.position.distanceTo(this.camera.position);
            /* const crossProd = cross(this.camera.position.x, this.camera.position.z, this.currentVista.position.x, this.currentVista.position.z); */
            /* const crossProd =
                new THREE.Vector2(
                    this.camera.position.x,
                    this.camera.position.z
                )
                .normalize()
                .cross(
                    new THREE.Vector2(
                        this.currentVista.position.x,
                        this.currentVista.position.z
                    )
                    .normalize()
                ) */
            const crossProd = 1 - (app.camera.rotation.y - this.direction % Math.TWO_PI) / Math.PI;
            log(crossProd)
            this.speed = Math.lerp(
                this.speed,
                Math.clamp((dist - 1290) / 1000, 0, this.maxSpeed) * (crossProd >= 0 ? crossProd : 0),
                dt / 80
            );

            if (dist < 1300) {
                app.interface.enter_focus(this.currentVista)

                this.currentVista.userData.post.visited = true;
                this.vistas.splice(0, 1)
                this.userInputDuringVista = false;
                if (this.exitFocusTimeout) clearTimeout(this.exitFocusTimeout);
                this.exitFocusTimeout = setTimeout(() => {
                    if (!this.userInputDuringVista && app.interface.focused_mode) {
                        log("User input not detected during vista focus, continuing.")
                        app.interface.exit_focus()
                    } else {
                        log("User input detected during vista focus, not exiting focus.")
                    }
                }, 14000)
            } else if (dist > 25000) {
                this.camera.position.copy(this.currentVista.position)
            }

        }
    }

    findNextVista() {
        if (app.posts && this.vistas.length < this.maxVistas) {
            const new_tree = this.findInterestingTree()
            if (new_tree == null) return false;
            if (!this.vistas.includes(new_tree)) {
                this.vistas.push(new_tree)

                if (false) {
                    const indicator = new THREE.Mesh(
                        new THREE.SphereGeometry(300),
                        new THREE.MeshBasicMaterial({
                            color: "blue"
                        }))
                    indicator.position.copy(new_tree.position);
                    indicator.position.y += 5000;
                    app.scene.add(indicator)
                }
                return true;
            }
        }
        return false;
    }

    findInterestingTree(fails = 0) {
        if (!app.trees) return null;
        const trees = app.trees;
        const t = trees[Math.floor(Math.random() * trees.length)];
        if (
            t.userData &&
            t.userData.post.score > 1024 &&
            !t.userData.post.visited &&
            !t.userData.post.has_media &&
            !t.userData.post.media &&
            !t.userData.post.url.includes("v.redd.it")
        ) {
            return t;
        } else if (fails < 1000) {
            fails++
            return this.findInterestingTree(fails);
        } else {
            throw new Error("No interesting tree found after " + fails + " tries.");
        }
    }
}

const cross = (ax, bx, ay, by) => {
    return ax * bx + ay * by;
}