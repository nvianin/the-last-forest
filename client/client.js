let loader = new THREE.GLTFLoader();
let loadList = [
    /* {
        name: "terrain"
    } */
]

let debug = true;
class App {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({

        });

        this.settings = {
            ground_side: 512
        }
        /* this.renderer.setClearColor(new THREE.Color(0x000000), .9) */

        this.camera = new THREE.PerspectiveCamera(90, innerWidth / innerHeight, .01, 1000);
        this.camera.position.set(0, .5, 1);
        if (debug) this.camera.position.set(10, 10, 10)
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        let bgCol = new THREE.Color(0x111522);
        this.fog = new THREE.Fog(bgCol, 0, 500);
        if (!debug) this.scene.fog = this.fog;
        this.renderer.setClearColor(bgCol);

        this.loadResources();

        this.initPostprocess()

        this.initSocket();

        /* this.sun = new THREE.HemisphereLight(0xa28173, 0x4466ff, 1) */
        this.skylight = new THREE.HemisphereLight(0x4ac0ff, 0x521c18, 1);
        this.scene.add(this.skylight);
        this.sun = new THREE.DirectionalLight(0xffaa44, 1);
        this.sun.position.set(50, 100, 50);
        this.sun.lookAt(0, 0, 0);
        this.sun.add(new THREE.DirectionalLightHelper(this.sun))
        this.scene.add(this.sun)

        this.test = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
        this.test.castShadow = true;
        this.test.position.y = 5;
        this.scene.add(this.test)

        this.initShadows();

        this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.autoRotate = true;
        this.orbitControls.target.set(0, 0, 0);

        this.input_timeout = false;

        document.body.appendChild(this.renderer.domElement);

        this.setSize();
        window.addEventListener("resize", this.setSize.bind(this))

        this.trees = [];

        // Ground generation & displacement
        this.ground = new THREE.Mesh(
            new THREE.PlaneGeometry(
                this.settings.ground_side,
                this.settings.ground_side,
                this.settings.ground_side,
                this.settings.ground_side),
            new THREE.MeshStandardMaterial({
                color: 0x444444,
                wireframe: false,
                side: 2,
            })
        )

        this.csm.setupMaterial(this.ground.material);

        this.ground.castShadow = true;
        this.ground.receiveShadow = true;


        this.ground.rotation.x = Math.PI / 2
        this.ground.updateMatrix();
        this.ground.geometry.applyMatrix4(this.ground.matrix);
        this.ground.rotation.x = 0;
        this.ground.updateMatrix()
        this.scene.add(this.ground)
        for (let i = 0; i < this.ground.geometry.attributes.position.array.length; i += 3) {
            let disp = this.getDisplacementAt(
                this.ground.geometry.attributes.position.array[i],
                this.ground.geometry.attributes.position.array[i + 1],
                this.ground.geometry.attributes.position.array[i + 2]
            )
            /* if (i % 3000 == 0) log(disp); */
            this.ground.geometry.attributes.position.array[i] += disp.x
            this.ground.geometry.attributes.position.array[i + 1] += disp.y
            this.ground.geometry.attributes.position.array[i + 2] += disp.z
        }

        let spires = 8
        this.helpers = []
        for (let t = 0; t < Math.PI * 2 * spires; t += .1) {
            let r = t / (Math.PI * 2 * spires);
            /* log(r, t) */
            let pos = this.generateSpiral(r, t);
            let helper = new THREE.AxesHelper(.05);
            this.helpers.push(helper)
            helper.position.copy(pos);
            this.scene.add(helper);
        }


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
        this.tree = new TreeManager("", new THREE.Vector3())
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
                        this.tree.turtl
                        e.alphConv(this.sentence),
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

        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(
                innerWidth,
                innerHeight
            ),
            1, // strength
            2, // radius
            1. // threshold
        );

        this.bokehPass = new THREE.BokehPass(this.scene, this.camera, {
            focus: 2.0,
            aperture: .000005,
            maxblur: .1,
            width: innerWidth,
            height: innerHeight,
        });
        this.fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);

        this.composer.addPass(this.renderScene);
        this.composer.addPass(this.fxaaPass);
        this.composer.addPass(this.bloomPass);
        /* this.composer.addPass(this.bokehPass); */
    }

    initShadows() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.sun.castShadow = true;
        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;

        this.sun.shadow.camera.near = .5;
        this.sun.shadow.camera.far = 512;

        this.sun.shadow.camera.top = 100;
        this.sun.shadow.camera.bottom = -100;
        this.sun.shadow.camera.right = 100;
        this.sun.shadow.camera.left = -100;

        this.sun.shadow.bias = -.0001;

        this.csm = new THREE.CSM({
            maxFar: 512,
            cascades: 3,
            mode: "practical",
            parent: this.scene,
            shadowMapSize: 1024,
            lightDirection: this.sun.position.clone().multiplyScalar(-1),
            camera: this.camera
        })


        if (debug) {
            this.shadowCameraHelper = new THREE.CameraHelper(this.sun.shadow.camera);
            this.scene.add(this.shadowCameraHelper);
        }
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
        this.socket.on("posts", posts => {
            this.posts = posts;
            log("posts received: ", posts)
        })
        this.socket.on("temperature_data", temperature_data => {
            this.temperature_data = temperature_data;
            log("temperature data received:", this.temperature_data)
        })
    }

    loadResources() {
        loadList.forEach(loadable => {
            loader.load("./resources/models/" + loadable.name + ".glb", gltf => {
                switch (loadable.name) {
                    case "terrain":
                        this.ground = gltf.scene;
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
        this.csm.update()
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

        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms.resolution.value.x = 1 / innerWidth * pixelRatio;
        this.fxaaPass.material.uniforms.resolution.value.y = 1 / innerHeight * pixelRatio;

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

    generateSpiral(r, t) {
        return new THREE.Vector3(
            Math.cos(t) * r,
            1 - r,
            Math.sin(t) * r,
        )
    }

    getDisplacementAt(x, y, z) {
        /* let r = Math.sqrt(this.ground.geometry.attributes.position.array[i] ** 2 + this.ground.geometry.attributes.position.array[i + 2] ** 2);
        let t = Math.atan(this.ground.geometry.attributes.position.array[i + 2] / this.ground.geometry.attributes.position.array[i]);
        return new THREE.Vector3(
            Math.cos(t) * r,
            1 - r,
            Math.sin(t) * r,
            ) */
        let pos = new THREE.Vector3(x, y, z);

        let dis = 1.;
        let blur = 1.;
        let width = .1;
        let uv = new THREE.Vector2(x, z);
        let angle = Math.atan2(x, z);
        let l = uv.distanceTo(new THREE.Vector2()) / 40;
        let offset = l + (angle / (2 * Math.PI)) * dis;
        let circles = offset % dis;

        let disp = new THREE.Vector3();
        disp.y = circles * 10;
        disp.y *= 1 - l;
        /* let d = 1 - (pos.distanceTo(new THREE.Vector3()) / this.settings.ground_side) - .5;
        disp.y += d * 50 - 25; */
        /* disp.y = Math.Smin(disp.y, -20, 80); */


        return disp;
    }
}

let app;

window.addEventListener("load", () => {
    app = document.app = new App;
    app.init()
})