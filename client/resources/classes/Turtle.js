let turtle_operations = [
    "F", // Forwards
    "B", // Backwards
    "R", // Right
    "L", // Left
    "+", // Positive Spin
    "-", // Negative Spin
    "U", // Up
    "D", // Down
    "[", // Store position
    "]", // Restore position
    "{", // Increase theta angle
    "}", // Decrease theta angle
    "S", // Spawn a sphere/fruit
]

class Turtle {
    constructor(scale = 1, alphConvRegister) {
        this.position = new THREE.Vector3();
        this.heading = new THREE.Vector3(0, 0, 1);
        this.object = new THREE.Object3D();

        this.alphConvRegister = alphConvRegister;
        /* log(alphConvRegister) */
        /* this.object.add(new THREE.AxesHelper(.3)) */
        this.helper = new THREE.AxesHelper(.3);
        app.scene.add(this.helper)
        this.scale = scale;
        this.object.scale.set(this.scale, this.scale, this.scale)
        app.scene.add(this.object)
        this.stored_position = new THREE.Vector3();
        this.stored_positions = [
            [new THREE.Vector3(), new THREE.Quaternion()]
        ];
        this.theta = ((Math.PI * 2) / 360) * 3.5;
        this.theta_backup = this.theta;
        this.theta_offset = ((Math.PI * 2) / 360) * .5;
        this.instance_id = app.instanceManager.register(this);
        this.fruit_scale = .23;
    }

    build(instruction) {
        app.instanceManager.return_all(this.instance_id);
        this.theta_backup = this.theta;
        this.object.position.copy(new THREE.Vector3());
        this.object.rotation.set(0, 0, 0)
        this.heading = new THREE.Vector3(0, 0, 1);
        this.stored_position = new THREE.Vector3();
        this.stored_positions = [
            [new THREE.Vector3(), new THREE.Quaternion()]
        ];
        let points = []
        points.push(this.object.position.clone())
        /* log("Building " + instruction); */
        /* log(instruction.length) */
        let i = instruction.length;
        let distance_factor;
        for (let char of instruction.toUpperCase().split("")) {
            distance_factor = Math.pow(i / instruction.length, 2)
            /* log(char, distance_factor) */
            /* distance_factor = 1 */
            switch (char) {
                case "F":
                    /* this.position.add(this.heading.clone().multiplyScalar(distance_factor)); */
                    this.object.translateY(distance_factor);
                    break;
                case "B":
                    /* this.position.sub(this.heading.clone().multiplyScalar(distance_factor)); */
                    this.object.translateY(-distance_factor);
                    break;
                case "R":
                    /* this.heading.applyAxisAngle(
                        new THREE.Vector3(0, 1, 0),
                        this.theta
                    ); */
                    this.object.rotateX(this.theta);
                    break;
                case "L":
                    /* this.heading.applyAxisAngle(
                        new THREE.Vector3(0, 1, 0),
                        -this.theta
                    ); */
                    this.object.rotateX(-this.theta);
                    break;
                case "U":
                    /* this.heading.applyAxisAngle(
                        new THREE.Vector3(1, 0, 0),
                        -this.theta
                    ); */
                    this.object.rotateZ(this.theta)
                    break;
                case "D":
                    /* this.heading.applyAxisAngle(
                        new THREE.Vector3(1, 0, 0),
                        -this.theta
                    ); */
                    this.object.rotateZ(-this.theta)
                    break;
                case "+":
                    this.object.rotateY(this.theta);
                    break;
                case "-":
                    this.object.rotateY(-this.theta);
                    break;
                case "[":
                    /* this.stored_position.copy(this.object.position); */
                    this.stored_positions.push(
                        [
                            this.object.position.clone(),
                            this.object.quaternion.clone()
                        ]);
                    break;
                case "]":
                    /* this.object.position.copy(this.stored_position); */
                    if (this.stored_positions.length > 1) {
                        let laspos = this.stored_positions.pop();
                        this.object.position.copy(laspos[0]);
                        this.object.quaternion.copy(laspos[1]);
                    } else {
                        let laspos = this.stored_positions[0];
                        this.object.position.copy(laspos[0]);
                        this.object.quaternion.copy(laspos[1]);
                    }
                    break;
                case "{":
                    this.theta += this.theta_offset;
                    break;
                case "}":
                    this.theta -= this.theta_offset;
                    break;
                case "S":
                    let i = app.instanceManager.borrow(
                        this.instance_id,
                        this.object.position.clone().add(
                            new THREE.Vector3(
                                0,
                                -distance_factor * this.fruit_scale,
                                0
                            )
                        ),
                        new THREE.Vector3(
                            distance_factor * this.fruit_scale,
                            distance_factor * this.fruit_scale,
                            distance_factor * this.fruit_scale
                        ),
                        this.object.quaternion.clone()
                    );
                    let c = new THREE.Color(
                        app.pearlPalette[
                            Math.floor(
                                Math.random() * app.pearlPalette.length
                            )
                        ]
                    );
                    app.instanceManager.instances.setColorAt(
                        i,
                        c
                    )
                    app.instanceManager.instances.instanceColor.needsUpdate = true;
                    break;
            }
            points.push(this.object.position.clone())
            i--;
            this.helper.position.copy(this.object.position);
            this.helper.position.multiplyScalar(this.scale)
        }
        this.theta = this.theta_backup;
        return points;
    }

    evolve(instruction, ruleset) {
        let new_instruction = ""
        for (let char of instruction.toUpperCase().split("")) {
            new_instruction += ruleset.getRule(char, true);
        }
        return new_instruction;
    }

    alphConv(seed) {
        let instruction = ""
        for (let char of seed.split("")) {
            let alphNum = this.alphConvRegister[char.toUpperCase()];
            if (alphNum) {
                /* log(turtle_operations[alphNum % 8]) */
                instruction = instruction.concat(turtle_operations[(alphNum - 1) % turtle_operations.length])
            }
        }
        return instruction
    }
}

class Ruleset {
    constructor(dom = null) {
        this.rules = {}
        this.dom = dom;
        this.updateDom()
    }

    addRule(input, output) {
        this.rules[input] = output
        /* log(this.rules) */
        this.updateDom()
    }

    getRule(key, conservative = false) {
        if (this.rules[key.toUpperCase()]) {
            return this.rules[key]
        } else if (conservative) {
            return key
        }
        return ""
    }

    clear() {
        this.rules = {}
        this.updateDom()
    }

    clone() {
        const copy = new Ruleset();
        copy.rules = this.rules;
        return copy;
    }

    randomize(n = 3, replace = true) {
        this.clear()
        let new_rules = []
        for (let i = 0; i < n; i++) {
            new_rules.push(
                [this.randomKey(1), this.randomSubstition()]
            )
        }
        if (replace) {
            this.clear()
        }
        for (let r of new_rules) {
            /* log(r) */
            this.addRule(r[0], r[1]);
        }
        /* log("Randomized rules: ", this.rules) */
        this.updateDom()
    }

    parse(string, replace = false) {
        let s = []
        string.split(", ").forEach(e => {
            let rule = e.split("->");
            /* log(rule) */
            if (rule.length > 1) {
                s.push(rule)
            }
        })
        if (replace) {
            this.clear();
        }
        for (let rule of s) {
            /* log(rule) */
            this.addRule(rule[0], rule[1]);
        }
    }

    randomKey(max = 4) {
        let result = "",
            length = Math.ceil(Math.random() * max);
        for (let i = 0; i < length; i++) {
            result += this.randomOp()
        }
        return result;
    }

    randomOp() {
        return turtle_operations[
            Math.floor(Math.random() * turtle_operations.length)
        ]
    }

    randomSubstition() {
        let result = "",
            length = Math.ceil(Math.random() * 6);
        for (let i = 0; i < length; i++) {
            result += this.randomOp();
        }
        if (result.includes("[") && !result.includes("]")) {
            result += "]"
        }
        return result
    }

    format() {
        let output = ""
        for (let key of Object.keys(this.rules)) {
            output += key + "->" + this.rules[key] + ", "
        }
        return output
    }

    updateDom() {
        if (this.dom) {
            if (this.dom.tagName == "TEXTAREA") {
                if (!app.input_timeout) this.dom.value = this.format()
            } else {
                this.dom.textContent = this.format()
            }
        }
    }
}