let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
let alphConvRegister = {}
i = 0
for (let letter of alphabet) {
    i++
    alphConvRegister[letter] = i
}

const alphConv = (seed) => {
    let result = []
    for (let part of seed) {
        let address = part.toUpperCase();
        if (alphConvRegister[address]) {
            result.push(alphConvRegister[address])
        }
    }
    return result
}

const parseRules = (seed) => {
    let rules = []
    /* log(seed.length / 3) */
    for (let i = 0; i < seed.length - seed.length % 3; i += 3) {
        rules.push([seed[i] / 26, seed[i + 1] / 26, seed[i + 2] / 26])

    }
    return rules
}

const treeTypes = {
    "Climate": {
        color: "lightblue",
        rules: new Ruleset().parse(
            "F->RF[RF[LFRSLF]SRF]"
        )
    },
    "Casual Friday": {
        color: "blue",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Economic": {
        color: "yellow",
        rules: new Ruleset().parse(
            "F->FL[[F]RF]RF[RFF]LF, F->FF"
        )
    },
    "Humor": {
        color: "teal",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Society": {
        color: "lightyellow",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Systemic": {
        color: "darkgreen",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Conflict": {
        color: 0x8a0303,
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Politics": {
        color: "red",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Ecological": {
        color: "green",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "COVID-19": {
        color: "darkgray",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L, LFLF->[LFLF[RRFFS]RRFLF]SLL"
        )
    },
    "Coping": {
        color: "orange",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Pollution": {
        color: "black",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Meta": {
        color: "lightblue",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Low Effort": {
        color: "darkred",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Food": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Diseases": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Water": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Resources": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Adaptation": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Science": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Energy": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Predictions": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Infrastructure": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Migration": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Shitpost Friday": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
    "Funny & Sad": {
        color: "brown",
        rules: new Ruleset().parse(
            "R->FFLS[RRLF[RFLF]LFLF]L"
        )
    },
}

const treeColors = {}
const load_colors = async () => {
    const vertexShader = await (await fetch("/resources/shaders/lineVertex.glsl")).text()
    log(vertexShader)

    const hexpalette = (await (await fetch("/resources/palettes/marshmellow32.hex")).text()).split("\r\n")
    let i = 0;
    for (key of Object.keys(treeTypes)) {
        /* log(hexpalette[i]) */
        treeTypes[key].color = "#" + hexpalette[i]
        /* log(treeTypes[key]) */
        i++;
    }

    Object.entries(treeTypes).forEach(([key, val]) => {
        treeColors[key] = new THREE.LineBasicMaterial({
            color: new THREE.Color(val.color),
            opacity: .7,
            transparent: true,
            linewidth: .002,
            vertexColors: false,
            alphaToCoverage: false
        })

        treeColors[key].onBeforeCompile = shader => {
            treeColors[key].userData.time = {
                value: 0
            }
            shader.uniforms.time = treeColors[key].userData.time;

            const [prelude, main] = vertexShader.split("////");
            shader.vertexShader = shader.vertexShader.replace("#include <clipping_planes_pars_vertex>", "#include <clipping_planes_pars_vertex> \n" + prelude)
            shader.vertexShader = shader.vertexShader.replace("#include <fog_vertex>", "#include <fog_vertex> \n" + main)

            /* log(shader.vertexShader) */
            /* log(shader.fragmentShader) */
        }
    })
}
load_colors()
class TreeManager {
    constructor(seed, position) {
        this.message = seed;
        this.seed = alphConv(seed);
        /* log(this.seed) */
        this.rules = parseRules(this.seed)
        /* log(this.rules) */
        this.branches = [];
        this.object = new THREE.Object3D();
        this.object.position.copy(position)
        this.scale = 1
        this.object.scale.set(this.scale, this.scale, this.scale)
        /* this.object.rotation.x = Math.PI */
        /* this.build(); */
        /* log(alphConvRegister) */
        this.turtle = new Turtle(this.scale, alphConvRegister);
        let instructions = this.turtle.alphConv(this.message)
        /* log(instructions) */
        let points = this.turtle.build(instructions)
        /* this.line = new THREE.Line2(
            new THREE.LineGeometry().setPositions(points),
            new THREE.LineMaterial({
                color: 0xffffff,
                linewidth: 5
            })
        );
        this.line.computeLineDistances(); */

        this.line_mat = new THREE.LineBasicMaterial({
            color: 0xffff33,
            opacity: .3,
            transparent: true,
            linewidth: .002,
            vertexColors: false,
            alphaToCoverage: false
        })


        /* this.line_mat.uniforms = {
            "time": {
                value: 0
            }
        } */
        /* this.line_mat.onBeforeCompile = (shader, renderer) => {
            log("line mat beforecompile")
            log(shader.vertexShader)
            shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
                float theta = sin( time + position.y ) / 1. };
                float c = cos( theta );
                float s = sin( theta );
                mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
                vec3 transformed = vec3( position ) * m;
                vNormal = vNormal * m;
            
            `)
        } */
        this.line = this.buildLineFromPoints(points)
        this.object.add(this.line);
        /* app.scene.add(this.object) */
    }

    buildLineFromPoints(points) {
        /* log("building line from " + points.length + " points")
        const points_reformatted = []
        points.forEach(p => {
            points_reformatted.push(p.x, p.y, p.z)
        }) */
        const linegeo = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(
            linegeo, this.line_mat)
        /* log("built line.") */
        return line
    }

    evolve() {
        let prev_point = new THREE.Vector3(0, 0, 0)
        /* log(this.seed) */
        for (let part of this.seed) {
            let points = [
                prev_point,
                (new THREE.Vector3(1, 1, 1).add(prev_point))
            ]
            this.branches.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points)))
            prev_point = points[1].clone()
        }
        this.branches.forEach(b => {
            this.object.add(b)
        })
        app.scene.add(this.object);
    }

    build_sentence(sentence) {
        let instructions = this.turtle.alphConv(sentence);
        let points = this.turtle.build(instructions);
        this.object.remove(this.line);
        this.line = this.buildLineFromPoints(points)
        this.object.add(this.line)
        this.postTransform();
        /* log(points) */

    }

    build_instructions(instructions) {
        let points = this.turtle.build(instructions);

        this.object.remove(this.line);
        this.line = this.buildLineFromPoints(points)
        this.object.add(this.line)
        this.postTransform();
        /* log(points) */
    }

    build_generations(sentence, generations, ruleset, color = 0xff0000) {
        let instructions = this.turtle.alphConv(sentence);
        for (let i = 0; i < generations; i++) {
            instructions = this.turtle.evolve(instructions, ruleset);
            if (instructions.length > 30000) break;
        }
        let points = this.turtle.build(
            instructions
        );
        app.lastInstructions = instructions;

        this.object.remove(this.line);
        this.line = this.buildLineFromPoints(points)
        this.object.add(this.line);
        this.postTransform();
        this.line.material.color = color;

        return this.object.clone();
    }
    // --------------------------------------------------------------------
    buildTreeType(type = "Climate", generations = 1) {
        const ruleset = treeTypes[type].rules.clone();
        /* ruleset.randomize(2, false); */
        const tree = this.build_generations(this.randomizeSentence(), generations, ruleset, new THREE.Color(treeTypes[type].color));
        tree.children[0].material = treeColors[type];
        tree.rotation.y = Math.random() * Math.TWO_PI
        return tree;
    }

    randomizeSentence() {
        let sentence = ""
        let count = Math.random() * 100 + 50;
        for (let i = 0; i < count; i++) {
            sentence += alphabet[Math.floor(Math.random() * alphabet.length)]
        }
        /* log(sentence) */
        return sentence;
    }

    postTransform() {

        /* log(this.object.children, this.object.children.length) */
        let toRemove = []
        while (this.object.children.length > 1) {
            this.object.children.forEach(c => {
                if (c.type != "Line") this.object.remove(c)
            })
        }
        /* log(this.object.children) */
        if (this.object.children.length > 1) throw new Error("Too many children on tree object")

        this.setSizeRelativeToBoundingSphere();

        const o = this.object.children[0];
        /* log(o.scale.x) */
        o.updateMatrix()
        o.geometry.applyMatrix4(o.matrix);
        o.scale.set(1, 1, 1)
        o.parent.scale.set(1, 1, 1)

        this.setRotationRelativeToCenterOfWeight();
    }

    setSizeRelativeToBoundingSphere() {
        /* return false; */
        this.object.children[0].geometry.computeBoundingSphere()
        let r = 1 / this.object.children[0].geometry.boundingSphere.radius;
        /* log(r, 1 / r) */
        this.object.children[0].scale.set(r, r, r);

        let instancedStuff = app.instanceManager.get_owned(this.turtle.instance_id);
        /* log(instancedStuff) */
        let scale = new THREE.Vector3();
        let rotation = new THREE.Quaternion();
        let position = new THREE.Vector3();
        for (let i of instancedStuff) {
            let dummy = new THREE.Matrix4();
            i = parseFloat(i)
            app.instanceManager.instances.getMatrixAt(i, dummy);
            /* log(dummy) */

            scale.setFromMatrixScale(dummy);
            position.setFromMatrixPosition(dummy);
            rotation.setFromRotationMatrix(dummy);

            /* dummy.elements[0] *= r;
            dummy.elements[4] *= r;
            dummy.elements[8] *= r; */

            dummy.compose(position.multiplyScalar(r), rotation, scale.multiplyScalar(r));

            /* dummy.elements[12] *= r;
            dummy.elements[13] *= r;
            dummy.elements[14] *= r; */


            app.instanceManager.instances.setMatrixAt(i, dummy);
        }
        app.instanceManager.instances.instanceMatrix.needsUpdate = true;

    }

    setRotationRelativeToCenterOfWeight() {
        return false
        let verts = this.object.children[0].geometry.attributes.position.array;
        let median = new THREE.Vector3();
        /* log(verts) */

        for (let i = 3; i < verts.length; i += 3) {
            const v = new THREE.Vector3(verts[i], verts[i + 1], verts[i + 2])
            const s = new THREE.Vector3(verts[i - 3], verts[i - 2], verts[i - 1]).sub(v).length()

            median.add(v.normalize().multiplyScalar(s));
        }

        median.divideScalar(verts.length);
        median = median.normalize()

        let normal = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), this.object.position, 1, new THREE.Color("green"))
        let arrow = new THREE.ArrowHelper(median.multiplyScalar(-1), this.object.position, median.length());

        log(median)
        /* helper.rotation.setFromVector3(dir) */
        app.scene.add(arrow);
        this.object.add(normal);

        let helper = new THREE.AxesHelper(.1);
        helper.position.copy(median);
        app.scene.add(helper);
        /* const rot = new THREE.Euler().setFromVector3(median) */
        //'YZX', 'ZXY', 'XZY', 'YXZ' and 'ZYX'.

        /* this.object.lookAt(new THREE.Vector3(0, 1, 0)) */
        /* this.object.rotateX(Math.PI) */
        this.object.rotation.copy(arrow.rotation)
        /* this.object.rotateX(Math.TWO_PI) */
        log(this.object.rotation)


        /* setTimeout(() => {
            app.scene.remove(arrow)
            app.scene.remove(helper);
        }, 1000) */
        /* this.object.lookAt(median) */
        /* this.object.rotate */

    }

    __DEPRECATED__build() {
        let prev_point = new THREE.Vector3(0, 0, 0);
        let points = [];
        let i = 1;
        let angle_mult = 90;
        for (let rule of this.rules) {
            i -= 1 / this.rules.length
            /* log(rule); */
            const next_point =
                sphericalToCartesian(rule[0] * i, (rule[1] * 2 - 1) * 360, (rule[2] * 2 - 1) * 15)
                .add(prev_point);
            points = points.concat(
                [
                    prev_point,
                    next_point
                ]
            )
            prev_point = next_point.clone()
        }
        this.object.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
                color: 0xffff00,
                linewidth: 3
            })
        ))
        /* this.object.add(
            new THREE.Line2(
                new THREE.LineGeometry().set,
                new THREE.LineMaterial({
                    color: 0xffff00,
                    linewidth: 5
                })
            )
        ) */

        /* this.object.scale.set(.1, .1, .1) */
        /* this.object.rotation.x = -Math.PI / 2 */
        app.scene.add(this.object)
    }
}