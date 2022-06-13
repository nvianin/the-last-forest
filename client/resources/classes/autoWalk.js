class AutoWalk {
    constructor(camera) {
        this.camera = camera;

        this.direction = camera.rotation.y;
        this.speed = 0;
        this.maxSpeed = .1;

        this.vistas = [];
        this.maxVistas = 32;

        this.vistaBufferingInterval = setInterval(() => {
            if (this.vistas.length < this.maxVistas) {
                const new_tree = this.findInterestingTree()
                if (!this.vistas.includes(new_tree)) this.vistas.push(new_tree)
            }
        }, 5000);

        this.currentVista;
    }

    walk(dt) {
        if (!this.currentVista) {
            this.currentVista = this.vistas.pop();
        } else {
            const angle = Math.atan2(this.camera.position.x - this.currentVista.position.x, this.camera.position.z - this.currentVista.position.z);
            this.direction = Math.lerp(this.direction, angle, dt);

            const dist = this.currentVista.position.distanceTo(this.camera.position);
            this.speed = Math.lerp(this.speed, Math.clamp(dist / 1000, 0, this.maxSpeed), dt);
        }
    }

    findInterestingTree(fails = 0) {
        const trees = app.trees;
        const t = trees[Math.floor(Math.random() * trees.length)];
        if (
            t.userData.post.score > 1024
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