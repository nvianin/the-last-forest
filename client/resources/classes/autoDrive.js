class AutoDrive {
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
                if (!this.vistas.includes(new_tree)) this.vistas.push(this.findInterestingTree)
            }
        }, 3000);
    }

    findInterestingTree(fails = 0) {
        const trees = app.trees;
        const t = trees[Math.floor(Math.random() * trees.length)];
        if (
            t.userData.score > 1024
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