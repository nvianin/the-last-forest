class BaseLine {
    constructor() {
        this.spires = 5;
        this.points = []
        this.maxRadius = 256;
        this.steps = 512;

        this.raycaster = new THREE.Raycaster();

        let r = 0;
        for (let t = 0; t < 2 * Math.PI * this.spires; t += (2 * Math.PI * this.spires) / this.steps) {
            this.points.push(
                new THREE.Vector3(
                    Math.cos(t) * r,
                    0,
                    Math.sin(t) * r,
                )
            )

            r += (this.maxRadius / this.steps) * 1.;
        }

        this.line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(this.points),
            new THREE.LineBasicMaterial({
                color: 0xff0000
            })
        );
        this.line.position.y = 10;

        this.helpers = []
        if (debug.line_markers) {
            for (let i = 0; i < 1; i += 1 / 100) {
                let h = new THREE.AxesHelper();
                h.position.copy(this.sample(i));
                this.sampleOnGround(i)
                app.scene.add(h)
                this.helpers.push(h)
            }
        }

        app.scene.add(this.line);
    }

    sample(t) {
        t = Math.clamp(t, 0, 1);
        let p1 = this.points[Math.floor(t * this.points.length)];
        if (p1 == this.points[this.points.length - 1]) return p1;
        let p2 = this.points[Math.floor(t * this.points.length + 1)];
        /* log(t, p1, p2) */
        return p1.clone().lerp(p2, t * this.points.length % 1).add(this.line.position);
    }

    sampleOnGround(t) {
        this.raycaster.set(this.sample(t), new THREE.Vector3(0, -1, 0));
        let i = this.raycaster.intersectObject(app.ground);
        if (i.length) {
            log(i[0])
        }
    }
}