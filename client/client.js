let loader = new THREE.GLTFLoader();
let loadList = [{
    name: "terrain"
}]
class App {
    constructor() {
        this.renderer = new THREE.WebGLRenderer();
        /* this.renderer.setClearColor(new THREE.Color(0x000000), .9) */

        this.camera = new THREE.PerspectiveCamera(90, innerWidth / innerHeight, .01, 1000);
        this.camera.position.set(0, .5, 1);
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        let bgCol = new THREE.Color(0x111522);
        this.fog = new THREE.Fog(bgCol, 0, 100);
        this.scene.fog = this.fog;
        this.renderer.setClearColor(bgCol);

        this.loadResources();

        this.initPostprocess()

        this.initSocket();

        this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.autoRotate = true;
        this.orbitControls.target.set(0, 0, 0);

        this.input_timeout = false;

        document.body.appendChild(this.renderer.domElement);

        this.setSize();
        window.addEventListener("resize", this.setSize.bind(this))

        this.trees = [];
        /* this.ground = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2, 3, 3),
            new THREE.MeshBasicMaterial({
                color: 0x444444,
                wireframe: true
            })
        )
        this.ground.rotation.x = Math.PI / 2
        this.scene.add(this.ground) */
        this.sun = new THREE.HemisphereLight(0xa28173, 0x4466ff, 14)
        this.sun.position.set(30, 30, 10);
        this.sun.lookAt(0, 0, 0)
        /* this.scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhysicalMaterial())) */
        this.scene.add(this.sun)

        /* this.pearlPalette = [
            0x4acdff,
            0xff46a3,
            0x37ffc8,
            0xff9555
        ] */
        this.pearlPalette = [
            0x000000,
            0xbe1e2d,
            0xffde17,
            0xffffff,
            0x21409a
        ]

        this.render()
    }

    init() {

        this.instanceManager = new InstanceManager(
            new THREE.SphereGeometry(),
            new THREE.MeshPhysicalMaterial({
                color: 0xf1f1f1,
                transmission: .8,
                roughness: .5,
                thickness: 1,
                opacity: .5,
                transparent: true,
            }),
            10000
        );

        /* this.instances = []
        this.instance_id = this.instanceManager.register()
        for (let i = 0; i < 100; i++) {
            this.instanceManager.borrow(this.instance_id, new THREE.Vector3(i, 0, 0), new THREE.Vector3(.1, .1, .1), new THREE.Quaternion());
        } */


        const sentences = [
            "I don't have a life, I have a routine.",
            "The trees speak to me, they have messages.",
            "I don't like eating pizza, it's too cheesy.",
            "The best part about being an adult is your childhood memories."
        ]
        /* log(sentences)
        let i = -sentences.length / 2;
        sentences.forEach(sent => {
            this.trees.push(new Tree(sent, new THREE.Vector3(i * 2, 0, 0)))
            i++
        }) */
        /* this.trees.push(new Tree(sentences[0])) */
        this.tree = new Tree("", new THREE.Vector3())
        this.rule_dom = document.querySelector("#rule-set");
        this.ruleset = new Ruleset(this.rule_dom)
        this.ruleset.randomize()

        this.ruleset.addRule("F", "RF[RF[RF]LF[LF[LFR]]]");
        this.ruleset.addRule("[", "[LUFLUF[FFUUF]RUFF")

        this.rule_dom.addEventListener("input", e => {
            if (this.input_timeout) {
                clearTimeout(this.input_timeout);
            }
            this.input_timeout = setTimeout(() => {
                clearTimeout(this.input_timeout);
                this.input_timeout = false;
                this.ruleset.parse(removeDiacritics(this.rule_dom.value).toUpperCase(), true)
                this.tree.build_generations(this.sentence, 5, this.ruleset)
            }, 2000)
            /* log(e) */
        })
        /* this.ruleset.addRule("U", "F") */

        this.input = document.querySelector("#text-input");
        this.input.addEventListener("input", e => {
            this.sentence = this.input.value;
            this.sentence = removeDiacritics(this.sentence)
            /* log(this.input.value); */
            this.tree.build_generations(this.sentence, 3, this.ruleset);
            this.lastInstructions = this.tree.turtle.alphConv(this.sentence);
            this.translation_output.textContent = this.tree.turtle.alphConv(this.sentence)
        })
        this.sentence = "Les arbres sont générés en fonction de la phrase tapée et de règles suivant un système de Lindenmayer. Créé par Aristid Lindenmayer, un biologiste Hongrois en 1968, ce système permet d'encoder un formule décrivant une forme végétale auto-réplicatrice dans une chaîne d'opérations représentées par des lettres."
        this.input.value = this.sentence
        this.sentence = removeDiacritics(this.sentence)
        this.translation_output = document.querySelector("#text-translation");
        this.input.dispatchEvent(new Event("input"))
        this.translation_output.textContent = this.tree.turtle.alphConv(this.sentence)
        document.body.addEventListener("keypress", e => {
            switch (e.key.toLowerCase()) {
                case " ":
                    if (this.lastInstructions.length < 100000) {
                        this.lastInstructions = this.tree.turtle.evolve(this.lastInstructions, this.ruleset);
                        this.tree.build_instructions(this.lastInstructions);
                    } else {
                        log("Next evolution too big !")
                    }
                    break;
                case "r":
                    /* this.ruleset.randomize();
                    this.lastInstructions = this.tree.turtle.evolve(
                        this.tree.turtle.alphConv(this.sentence),
                        this.ruleset
                    )
                    this.tree.build_instructions(
                        this.lastInstructions
                    ) */
                    this.ruleset.randomize()
                    this.tree.build_generations(this.sentence, 30, this.ruleset)

                    break;
                case "c":
                    this.orbitControls.reset();
                    break;
            }
        })
        this.input.addEventListener("keypress", e => {
            e.stopPropagation();
        })
        this.rule_dom.addEventListener("keypress", e => {
            e.stopPropagation();
        })
        let i = 0;
        this.trees = []
        for (let s of sentences) {
            this.tree.build_sentence(s)
            let o = new THREE.Object3D()
            this.tree.object.copy(o);
            o.position.set(i, 0, 0)
            this.scene.add(o)
            this.trees.push(o)
            i++
        }

        window.addEventListener("pointerup", e => {
            this.preventAutoRotate();
        })
        window.addEventListener("wheel", e => {
            this.preventAutoRotate();
        })

    }

    initPostprocess() {
        this.renderScene = new THREE.RenderPass(this.scene, this.camera);
        this.composer = new THREE.EffectComposer(this.renderer);
        this.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1, 2, .3); // strength, radius, threshold
        this.bokehPass = new THREE.BokehPass(this.scene, this.camera, {
            focus: 2.0,
            aperture: .00001,
            maxblur: .01,
            width: innerWidth,
            height: innerHeight,
        });
        this.composer.addPass(this.renderScene);
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(this.bokehPass);
    }

    initSocket() {
        this.socket = io()
        this.connectionFailed = false;
        this.socket.on("connect", () => {
            log("Connected");
            if (this.connectionFailed) window.location.reload()
        })
        this.socket.on("disconnect", () => {
            log("Disconnected !");
            this.connectionFailed = true;
        })
    }

    loadResources() {
        loadList.forEach(loadable => {
            loader.load("./resources/models/" + loadable.name + ".glb", gltf => {
                switch (loadable.name) {
                    case "terrain":
                        gltf.scene.children[0].material =
                            new THREE.MeshBasicMaterial({
                                color: 0x444444,
                                wireframe: true,
                            })
                        gltf.scene.children[0].scale.set(100, 100, 100);
                        gltf.scene.children[0].position.y = -1.5;
                        break;
                }
                this.scene.add(gltf.scene)
            })
        })
    }

    render() {
        this.clock.getElapsedTime()
        /* this.renderer.render(this.scene, this.camera); */
        this.composer.render();
        requestAnimationFrame(this.render.bind(this))
        this.trees.forEach(tree => {
            /* tree.object.rotation.y = this.clock.elapsedTime / 1 */
        })
        this.orbitControls.update()
    }

    setSize() {
        this.renderer.setSize(innerWidth, innerHeight);
        this.composer.setSize(innerWidth, innerHeight);
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();

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

let app;

window.addEventListener("load", () => {
    app = document.app = new App;
    app.init()
})