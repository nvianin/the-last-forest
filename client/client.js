const loader = new THREE.GLTFLoader();
const loadList = [
    /* {
        name: "terrain"
    } */
    {
        name: "tree",
        dontadd: true
    },
    {
        name: "dead_tree",
        dontadd: true
    }
]

const debug = {
    shadow_helper: false,
    sun_helper: false,
    frameRate: false,
    fog: true,
    line_markers: false,
    line_show: false,
    half_res_renderer: false,
    debug_target_frameRate: {
        enabled: true,
        value: 5
    },

    use_cached_data: false,

    enable: () => {
        for (let key of Object.keys(debug)) {
            if (key != "enable" && key != "disable") debug[key] = true;
        }
    },
    disable: () => {
        for (let key of Object.keys(debug)) {
            if (key != "enable" && key != "disable") debug[key] = false;
        }
    },
}
const simplex = new THREE.SimplexNoise()
let waiting_to_release_tooltip = false;
class App {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            /* logarithmicDepthBuffer: true */
            antialias: true
        });

        if (debug.half_res_renderer) this.renderer.pixelRatio = .5;

        const localstorage_posts = localStorage.getItem("posts");
        if (localstorage_posts) this.posts = localstorage_posts;
        const localstorage_points = localStorage.getItem("points");
        if (localstorage_points) this.points = localstorage_points;

        this.settings = {
            ground_side: 128
        }
        /* this.renderer.setClearColor(new THREE.Color(0x000000), .9) */

        this.camera = new THREE.PerspectiveCamera(90, innerWidth / innerHeight, .01, 1000);
        this.camera.position.set(0, .5, 1);
        /* if (debug)  */
        this.camera.position.set(50, 100, 50)
        this.camera.position.set(0, 100, 0)
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        let bgCol = new THREE.Color(0x111522);
        this.fog = new THREE.Fog(bgCol, 400, 900);
        if (debug.fog) this.scene.fog = this.fog;
        this.renderer.setClearColor(bgCol);

        this.initSocket();

        this.loadResources();

        this.initPostprocess()

        this.postDom = document.querySelector("#post-tooltip")

        this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        /* this.orbitControls.autoRotate = true; */
        this.orbitControls.target.set(0, 0, 0);
        /* this.sun = new THREE.HemisphereLight(0xa28173, 0x4466ff, 1) */
        /* this.skylight = new THREE.HemisphereLight(0x4ac0ff, 0x521c18, 1);
        this.scene.add(this.skylight); */
        this.sun = new THREE.DirectionalLight(0xffffaa, 2);
        this.sun.position.set(50, 100, 50);
        this.sun_target_offset = new THREE.Vector3(-20, -10, -40);
        /* this.sun.lookAt(0, 0, 0); */

        this.sun.rotation.copy(this.sun.rotation)
        if (debug.sun_helper) this.sun.add(new THREE.DirectionalLightHelper(this.sun))
        this.scene.add(this.sun)

        this.test = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
        this.test.castShadow = true;
        this.test.receiveShadow = true;
        this.test.position.y = 15;
        /* this.scene.add(this.test) */

        this.initShadows();


        this.mousecast = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.mouse = new THREE.Vector2();


        this.input_timeout = false;

        this.renderer.domElement.id = "three"
        document.body.appendChild(this.renderer.domElement);

        this.setSize();
        window.addEventListener("resize", this.setSize.bind(this))
        window.addEventListener("contextmenu", e => {
            e.preventDefault();
        });

        this.trees = [];
        this.tree_imposters = [];

        // Ground generation & displacement
        this.ground = new THREE.Mesh(
            new THREE.PlaneGeometry(
                this.settings.ground_side,
                this.settings.ground_side,
                this.settings.ground_side,
                this.settings.ground_side),
            new THREE.MeshStandardMaterial({
                color: 0x333355,
                wireframe: true,
                side: 0,
            })
        )

        /* this.csm.setupMaterial(this.ground.material); */

        this.ground.castShadow = true;
        this.ground.receiveShadow = true;


        this.ground.rotation.x = -Math.PI / 2
        this.ground.scale.set(6, 6, 6);
        this.ground.updateMatrix();
        this.ground.geometry.applyMatrix4(this.ground.matrix);
        this.ground.rotation.x = 0;
        this.ground.scale.set(1, 1, 1);
        this.ground.updateMatrix()
        this.scene.add(this.ground)
        for (let i = 0; i < this.ground.geometry.attributes.position.array.length; i += 3) {
            let disp = this.getDisplacementAt(
                this.ground.geometry.attributes.position.array[i],
                this.ground.geometry.attributes.position.array[i + 1],
                this.ground.geometry.attributes.position.array[i + 2]
            )
            if (i % 3000 == 0) log(disp);
            this.ground.geometry.attributes.position.array[i] += disp.x
            this.ground.geometry.attributes.position.array[i + 1] += disp.y
            this.ground.geometry.attributes.position.array[i + 2] += disp.z
        }
        this.ground.geometry.computeVertexNormals();

        /* let spires = 8
        this.helpers = []
        for (let t = 0; t < Math.PI * 2 * spires; t += .1) {
            let r = t / (Math.PI * 2 * spires);
            log(r, t)
            let pos = this.generateSpiral(r, t);
            let helper = new THREE.AxesHelper(.05);
            this.helpers.push(helper)
            helper.position.copy(pos);
            this.scene.add(helper);
        } */


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

        this.temperature_palette = {
            start_tone: new THREE.Color(0x00ff00),
            end_tone: new THREE.Color(0xff0000),
            start: 0,
            end: 3.5
        }

        if (debug.frameRate) {
            this.frameRateDom = document.createElement("div");
            this.frameRateDom.style.zIndex = 9000;
            this.frameRateDom.style.position = "fixed";
            this.frameRateDom.style.top = "0px";
            this.frameRateDom.style.left = "0px";
            this.frameRateDom.style.color = "white";
            this.frameRateDom.innerText = "0fps"
            document.body.appendChild(this.frameRateDom)
        }

        this.frameCount = 0;
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

        /* this.baseLine = new BaseLine(); */

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


        this.baseRuleSet = new Ruleset();
        this.baseRuleSet.addRule("F", "RF[RF[RF]LF[LF[LFR]]]");
        this.baseRuleSet.addRule("[", "[LUFLUF[FFUUF]RUFF");


        /* this.tree = new TreeManager("", new THREE.Vector3()) */
        this.rule_dom = document.querySelector("#rule-set");
        this.ruleset = this.baseRuleSet.clone();
        this.ruleset.randomize()

        /* this.ruleset.addRule("F", "RF[RF[RF]LF[LF[LFR]]]");
        this.ruleset.addRule("[", "[LUFLUF[FFUUF]RUFF") */



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
                    /* if (this.lastInstructions.length < 100000) {
                        this.lastInstructions = this.tree.turtle.evolve(this.lastInstructions, this.ruleset);
                        this.tree.build_instructions(this.lastInstructions);
                    } else {
                        log("Next evolution too big !")
                    }
                    break; */
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
                    /* this.ruleset.randomize()
                    this.tree.build_generations(this.sentence, 30, this.ruleset) */

                    break;
                case "c":
                    this.orbitControls.reset();
                    break;
            }
        })

        this.activeTree = 0;
        document.body.addEventListener("keydown", e => {
            /* log(e) */
            switch (e.key) {
                case "ArrowLeft":
                    if (this.activeTree == 0) {
                        this.activeTree = this.trees.length - 1;
                    } else {
                        this.activeTree--;
                    }
                    break;
                case "ArrowRight":
                    if (this.activeTree < this.trees.length - 1) {
                        this.activeTree++;
                    } else {
                        this.activeTree = 0;
                    }
                    break;
            }

            /* log(this.activeTree); */

            /* this.orbitControls.target.copy(this.trees[this.activeTree].position)
            this.camera.position.copy(this.orbitControls.target.clone().add(new THREE.Vector3(5, 3, 0))) */
        })
        this.input.addEventListener("keypress", e => {
            e.stopPropagation();
        })
        this.rule_dom.addEventListener("keypress", e => {
            e.stopPropagation();
        })
        /* let i = 0;
        for (let s of sentences) {
            this.tree.build_sentence(s)
            let o = new THREE.Object3D()
            this.tree.object.copy(o);
            o.position.set(i, 0, 0)
            this.scene.add(o)
            this.trees.push(o)
            i++
        } */

        window.addEventListener("pointermove", e => {
            this.pointer.x = (e.clientX / innerWidth) * 2 - 1;
            this.pointer.y = -(e.clientY / innerHeight) * 2 + 1;
            /* log(this.pointer) */
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        })

        window.addEventListener("pointerup", e => {
            /* this.preventAutoRotate(); */
            log(e.button)
            if (this.postDom.style.visibility == "visible" && e.button == 0) window.open(this.activeUrl)
        })
        window.addEventListener("pointerdown", e => {

        })
        window.addEventListener("wheel", e => {
            /* this.preventAutoRotate(); */
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
            .4 // threshold
        );

        this.bokehPass = new THREE.BokehPass(this.scene, this.camera, {
            focus: 2.0,
            aperture: .000005,
            maxblur: .1,
            width: innerWidth,
            height: innerHeight,
        });
        this.fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);

        this.saoPass = new THREE.SAOPass(this.scene, this.camera, false, true);
        this.saoPass.params.saoIntensity = .003;
        this.saoPass.params.saoBias = 1;
        this.saoPass.params.saoKernelRadius = 10;
        this.saoPass.params.saoScale = 3;

        this.outlinePass = new THREE.OutlinePass(new THREE.Vector2(innerWidth, innerHeight), this.scene, this.camera);


        /* this.ssaoPass = new THREE.SSAOPass(this.scene, this.camera, innerWidth, innerHeight); */
        /* this.ssaoPass. */


        /* this.taaPass = new THREE.TAARenderPass(this.scene, this.camera);
        this.taaPass.unbiased = false;
        this.taaPass.sampleLevel = 0; */

        /* this.composer.addPass(this.bokehPass); */
        /* this.composer.addPass(this.taaPass); */
        /* this.composer.addPass(this.ssaoPass); */

        this.composer.addPass(this.renderScene);
        this.composer.addPass(this.fxaaPass);
        /* this.composer.addPass(this.bloomPass);
        this.composer.addPass(this.saoPass); */
        this.composer.addPass(this.outlinePass)
    }

    initShadows() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.sun.castShadow = true;
        this.sun.shadow.mapSize.width = 1024 * 1;
        this.sun.shadow.mapSize.height = 1024 * 1;

        this.sun.shadow.camera.near = 100;
        this.sun.shadow.camera.far = 200;

        const shadow_camera_bound = 50;

        this.sun.shadow.camera.top = shadow_camera_bound;
        this.sun.shadow.camera.bottom = -shadow_camera_bound;
        this.sun.shadow.camera.right = shadow_camera_bound;
        this.sun.shadow.camera.left = -shadow_camera_bound;

        this.sun.shadow.bias = -.0001;

        /* this.csm = new THREE.CSM({
            maxFar: this.camera.far,
            cascades: 1,
            mode: "practical",
            parent: this.scene,
            shadowMapSize: 1024,
            lightDirection: this.sun.position.clone().sub(this.sun.target.position).normalize(),
            camera: this.camera
        }) */


        if (debug.shadow_helper) {
            this.shadowCameraHelper = new THREE.CameraHelper(this.sun.shadow.camera);
            this.scene.add(this.shadowCameraHelper);
        }
    }

    async initSocket() {

        if (debug.use_cached_data) {
            this.points = JSON.parse(await (await fetch("./sample_points.json")).text());
            this.posts = JSON.parse(await (await fetch("./sample_posts.json")).text());
            this.connection_conditions_count = 0;
            this.connection_conditions_threshold = 2;
            this.buildTreesFromPosts()
        } else {
            this.connection_conditions_count = 0;
            this.connection_conditions_threshold = 4;

            this.socket = io()
            this.connectionFailed = false;
            this.socket.on("connect", () => {
                log("Connected");
                if (this.connectionFailed) {
                    window.location.reload()
                }
            })
            this.socket.on("disconnect", () => {
                log("Disconnected !");
                this.connectionFailed = true;
            })
            this.socket.on("posts", posts => {
                this.posts = posts;
                window.localStorage.setItem("posts", JSON.stringify(this.posts))
                log("posts received " /* , posts */ )

                this.connection_conditions_count++;
                this.buildTreesFromPosts();

            })
            this.socket.on("temperature_data", temperature_data => {
                this.temperature_data = temperature_data;
                log("temperature data received " /* , this.temperature_data */ )
                /* this.buildTreesFromPosts(); */
                this.connection_conditions_count++;
                this.buildTreesFromPosts();
            })
            this.socket.on("points", points => {
                log("points received ", points)
                this.points = points;
                window.localStorage.setItem("points", JSON.stringify(points));
                this.connection_conditions_count++;
                this.buildTreesFromPosts();
            })
        }
    }

    loadResources() {
        loadList.forEach(loadable => {
            loader.load("./resources/models/" + loadable.name + ".glb", gltf => {
                switch (loadable.name) {
                    case "terrain":
                        this.ground = gltf.scene;
                        gltf.scene.children[0].material =
                            new THREE.MeshStandardMaterial({
                                color: 0x444444,
                                wireframe: true,
                            })
                        gltf.scene.children[0].scale.set(100, 100, 100);
                        gltf.scene.children[0].position.y = -1.5;
                        break;
                    case "tree":
                        gltf.scene.children[0]
                        /* log(Object.keys(this.posts).length) */
                        this.tree_model = gltf.scene.children[0];
                        this.connection_conditions_count++;
                        this.buildTreesFromPosts()
                        break;
                    case "dead_tree":
                        this.dead_tree_model = gltf.scene.children[0];
                        this.connection_conditions_count++;
                        this.buildTreesFromPosts();
                }
                if (!loadable.dontadd) {
                    this.scene.add(gltf.scene)
                }
            })
        })
    }

    buildTreesFromPosts() {
        log(this.ground)
        const raycaster = new THREE.Raycaster();
        log(this.connection_conditions_count, this.connection_conditions_threshold, " conditions")
        if (!this.built_trees && this.connection_conditions_count == this.connection_conditions_threshold) {
            let i = 0;
            /* log(this.posts)
            log(Object.keys(this.posts).length) */
            for (let post of Object.values(this.posts)) {
                if (post.sentiment && post.sentiment.score) {
                    const t = Math.floor((i / Object.keys(this.posts).length) * this.points.length);
                    const x = this.points[t][0] * 2 - 384;
                    const z = this.points[t][1] * 2 - 384;
                    let y = -100;

                    let tree = post.sentiment.score > 0 ? this.tree_model.clone() : this.dead_tree_model.clone();
                    raycaster.set(
                        new THREE.Vector3(
                            x, 100, z
                        ),
                        new THREE.Vector3(0, -1, 0)
                    )
                    const intersects = raycaster.intersectObject(this.ground);
                    if (intersects.length) {
                        y = intersects[0].point.y;
                        log(intersects[0].point)
                    }
                    tree.position.set(
                        x,
                        y,
                        z
                    )
                    tree.userData.post = post;
                    this.scene.add(tree)
                    this.trees.push(tree)

                    /* try {
                        log(post.title, Math.round_to_digit(post.sentiment.score, 1), Math.round_to_digit(post.sentiment.magnitude, 1))
                    } catch {
                        log(post)
                    } */
                    i++;
                }
            }
            this.built_trees = true;
            for (let t of this.trees) {
                if (!t.userData.post || !t.userData.post.sentiment || !t.userData.post.sentiment.score) {
                    this.scene.remove(t);
                }
            }
            log("Successfully built " + i + " trees")
        }
    }

    buildTreesFromPosts__old() {
        let i = 0;
        for (let post of Object.values(this.posts)) {
            const d = new Date(post.date * 1000);
            d.year = d.getFullYear();
            d.month = d.getMonth();
            while (this.temperature_data[d.year][d.month] == "***") {
                if (d.month == 0) break;
                d.month--
            }
            /* log(d.year, d.month, this.temperature_data[d.year][d.month]) */
            let rules = this.baseRuleSet.clone();
            rules.randomize(2, false);

            let color = this.temperature_palette.start_tone.clone()
                .lerpHSL(this.temperature_palette.end_tone,
                    Math.map(parseFloat(this.temperature_data[d.year][d.month]),
                        this.temperature_palette.start,
                        this.temperature_palette.end,
                        0,
                        1
                    ));

            this.tree.build_generations(post.title, 35, rules, color);
            let tree = this.tree.line.clone();
            tree.text = post.title;
            this.trees.push(tree)
            const imposter = new THREE.Mesh(
                new THREE.SphereGeometry(),
                new THREE.MeshBasicMaterial({
                    visible: false
                })
            );
            imposter.position.copy(tree.position);
            imposter.tree = tree;
            this.scene.add(imposter)
            this.tree_imposters.push(imposter)
            const point = this.baseLine.sampleOnGround(i / Object.keys(this.posts).length)
            tree.position.copy(point);
            /* log(point) */
            /* const sample = this.baseLine.sample(Math.map(i / Object.keys(this.posts).length, 0, 1, .2, .8));
            const disp = this.getDisplacementAt(sample.x, sample.y, sample.z);
            tree.position.copy(sample);
            tree.position.add(disp)
            log(sample, disp, tree.position); */
            this.scene.add(tree)
            i++;
            /* break; */
        }
    }

    render() {
        this.frame_time = Date.now();
        this.clock.getElapsedTime()

        /* this.renderer.render(this.scene, this.camera); */
        this.composer.render();

        this.sun.position.copy(this.camera.position).add(new THREE.Vector3(50, 100, 50));
        this.sun.target.position.copy(this.camera.position).add(this.sun_target_offset);
        this.sun.target.updateMatrixWorld();


        /* this.csm.update(this.camera.matrix) */

        this.postDom.style.left = this.mouse.x + "px";
        this.postDom.style.top = this.mouse.y + "px";


        this.orbitControls.update()
        if (this.built_trees) {
            this.mousecast.setFromCamera(this.pointer, this.camera);
            const intersects = this.mousecast.intersectObjects(this.trees);
            if (intersects[0]) {
                this.outlinePass.selectedObjects = [intersects[0].object.parent]
                intersects[0].object.parent.active = true;

                /* log("found tree ", intersects[0].object) */
                /* log(intersects[0].object.parent.userData.post) */
                const post = intersects[0].object.parent.userData.post;
                this.renderer.domElement.style.cursor = "pointer"
                this.postDom.style.cursor = "pointer"


                this.postDom.innerHTML = post.title;
                this.postDom.innerHTML += "<br> <i>" + this.sentimentToIdiom(Math.round_to_decimal(post.sentiment.score, 2)) + "</i>";
                this.activeUrl = post.url;
                this.postDom.style.visibility = "visible";

            } else {
                this.renderer.domElement.style.cursor = "default";
                this.postDom.style.cursor = "default";
                if (this.outlinePass.selectedObjects[0]) {
                    this.outlinePass.selectedObjects[0].active = false;
                }
                if (!waiting_to_release_tooltip) {
                    waiting_to_release_tooltip = true;
                    setTimeout(() => {
                        this.postDom.style.visibility = "hidden";
                        waiting_to_release_tooltip = false;
                    }, 200)
                }
                this.outlinePass.selectedObjects = []
            }
        }


        /* this.lastFrame = frame_time; */
        this.frameRate = 1000 / (Date.now() - this.frame_time)
        if (debug.frameRate) this.frameRateDom.innerText = Math.floor(this.frameRate) + "fps"
        /* if (debug.frameRate) this.frameRateDom.innerText = Date.now() - this.frame_time; */
        if (debug.debug_target_frameRate.enabled) {
            setTimeout(requestAnimationFrame(this.render.bind(this)), debug.debug_target_frameRate.value)
        } else {
            requestAnimationFrame(this.render.bind(this))
        }
        this.frameCount++;
    }

    setSize() {
        this.renderer.setSize(innerWidth, innerHeight);
        this.composer.setSize(innerWidth, innerHeight);
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();

        this.fxaaPass.material.uniforms.resolution.value.x = 1 / innerWidth * this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms.resolution.value.x = 1 / innerHeight * this.renderer.getPixelRatio();
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

        /* let pos = new THREE.Vector3(x, y, z); */

        const sc = .005;

        const disp = new THREE.Vector3(
            0,
            simplex.noise3d(y * sc, z * sc, x * sc) * 10,
            0,
        )
        disp.y += simplex.noise3d(
            x * (sc / 4),
            y * (sc / 4),
            z * (sc / 4)
        ) * 30;

        return disp;


        let dis = 1.;
        let blur = .5;
        let width = .5;
        let uv = new THREE.Vector2(x, z);
        let angle = Math.atan2(x, z);
        let l = uv.distanceTo(new THREE.Vector2()) / 50;
        let offset = l + (angle / (2 * Math.PI)) * dis;
        let circles = offset % dis;

        circles = Math.smoothStep(circles - blur, circles, width) - Math.smoothStep(circles, circles + blur, width);

        disp.y = circles * 10;
        disp.y *= 1 - l;

        /* let d = 1 - (pos.distanceTo(new THREE.Vector3()) / this.settings.ground_side) - .5;
        disp.y += d * 50 - 25; */
        /* disp.y = Math.Smin(disp.y, -20, 80); */

        return disp;
    }

    sentimentToIdiom(sentiment) {
        return sentiment > .9 ? "Perfect !" : sentiment > .7 ? "Beautiful !" : sentiment > .5 ? "Nice !" : sentiment > .3 ? "I like it." : sentiment > .1 ? "Good." : sentiment == 0 ? "I don't know what this means." : sentiment > -.1 ? "Eh." : sentiment > -.3 ? "Ouch." : sentiment > -.5 ? "That's bad." : sentiment > -.7 ? "That's very bad." : sentiment > -.9 ? "Oh no !" : "Fuck."
    }
}

let app;

window.addEventListener("load", () => {
    app = window.app = new App;
    app.init()
})