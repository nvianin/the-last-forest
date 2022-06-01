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

const urlParams = new URLSearchParams(window.location.search)

debug_activated = urlParams.get("debug") == ""
if (debug_activated) {
    log("Debug activated by url")
} else {
    log("Debug deactivated by url")
}

const debug = {
    shadow_helper: false,
    sun_helper: false,
    frameRate: false,
    fog: true,
    line_markers: false,
    line_show: false,
    half_res_renderer: false,
    debug_target_frameRate: {
        enabled: false,
        value: 5
    },
    treeSeparationArrows: false,
    use_cached_data: false || debug_activated,
    aggregate: false,
    show_imposters: true,
    particle: true,
    postprocessing: true,
    autostart: false,
    max_generation_level: 6,
    tree_build_limit: 0,

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

for ([key, debug_parameter] of Object.entries(debug)) {
    if (debug_parameter && typeof (debug_parameter) == "boolean") log("debug setting " + key + " enabled")
}

const simplex = new THREE.SimplexNoise()
let waiting_to_release_tooltip = false;
class App {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            logarithmicDepthBuffer: true,
            antialias: true
        });
        this.renderer.info.autoReset = false;
        this.renderer.setPixelRatio(window.devicePixelRatio);

        if (debug.half_res_renderer) this.renderer.pixelRatio = .5;

        const localstorage_posts = localStorage.getItem("posts");
        if (localstorage_posts) this.posts = localstorage_posts;
        const localstorage_points = localStorage.getItem("points");
        if (localstorage_points) this.points = localstorage_points;

        this.settings = {
            ground_side: 96 * 2,
            ground_scale: 128 * 6,
            draw_distance: 30000,
            fog_offset: 5000,
            walking_fog_multiplier: .1,
            focused_max_raycast_dist: 1000,
            tsne_scale_multiplier: 39
        }
        /* this.renderer.setClearColor(new THREE.Color(0x000000), .9) */

        this.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .01, debug.fog ? this.settings.draw_distance + 1000 : 3000);
        this.camera.position.set(0, .5, 1);
        /* if (debug)  */
        this.camera.position.set(50, 100, 50)
        this.camera.position.set(0, this.settings.draw_distance - this.settings.fog_offset, 0)
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        let bgCol = new THREE.Color(0x000510);
        let fakeBackCol = bgCol.clone()
        this.fog = new THREE.Fog(bgCol, this.settings.draw_distance - this.settings.fog_offset, this.settings.draw_distance);
        /* this.fog = new THREE.FogExp2(bgCol, 1.);
        this.fog.near = this.settings.draw_distance - this.settings.fog_offset;
        this.fog.far = this.settings.draw_distance; */
        if (debug.fog) this.scene.fog = this.fog;
        this.renderer.setClearColor(bgCol);

        this.initSocket();

        /* this.loadResources(); */

        if (debug.postprocessing) this.initPostprocess()

        this.postDom = document.querySelector("#post-tooltip")


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

        this.ambientLight = new THREE.AmbientLight(0xff0167)
        this.scene.add(this.ambientLight);

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
        this.trees_by_category = {}

        // Ground generation & displacement
        this.ground = new THREE.Mesh(
            new THREE.PlaneGeometry(
                this.settings.ground_side,
                this.settings.ground_side,
                this.settings.ground_side,
                this.settings.ground_side),
            new THREE.MeshStandardMaterial({
                color: 0x111133,
                wireframe: true,
                side: 0,
            })
        )
        this.ground.name = "ground"

        /* this.csm.setupMaterial(this.ground.material); */

        this.ground.castShadow = true;
        this.ground.receiveShadow = true;


        this.ground.rotation.x = -Math.PI / 2
        this.ground.scale.set(this.settings.ground_scale, this.settings.ground_scale, this.settings.ground_scale);
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
            /* if (i % 3000 == 0) log(disp); */
            this.ground.geometry.attributes.position.array[i] += disp.x
            this.ground.geometry.attributes.position.array[i + 1] += disp.y
            this.ground.geometry.attributes.position.array[i + 2] += disp.z
        }
        this.ground.geometry.computeVertexNormals();
        this.ground.geometry.computeBoundingBox()
        log("Ground extent: " + this.ground.geometry.boundingBox.max.x * 2)

        this.ground_fakeBack = this.ground.clone();
        this.ground_fakeBack.material = new THREE.MeshPhysicalMaterial({
            roughness: .9,
            specularIntensity: .3,
            color: fakeBackCol,
            transparent: true
        })
        this.ground_fakeBack.position.y -= .2
        this.scene.add(this.ground_fakeBack)
        if (debug.particle) {
            fetch("/resources/shaders/dustFrag.glsl").then(resp => {
                resp.text().then(frag => {
                    fetch("/resources/shaders/dustVert.glsl").then(resp => {
                        resp.text().then(vert => {
                            this.dustParticles = new THREE.Points(
                                new THREE.PlaneBufferGeometry(this.settings.ground_side, this.settings.ground_side, this.settings.ground_side * 2, this.settings.ground_side * 2),
                                /* new THREE.ShaderMaterial({
                                    vertexShader: vert,
                                    fragmentShader: frag
                                }) */
                                new THREE.PointsMaterial({
                                    transparent: true
                                })
                            )
                            this.dustParticles.rotation.x = -Math.HALF_PI
                            this.dustParticles.userData.uniforms = {
                                time: {
                                    value: 0
                                }
                            }
                            this.dustParticles.material.onBeforeCompile = shader => {
                                shader.uniforms.time = this.dustParticles.userData.uniforms.time;
                                /* log(shader.fragmentShader) */
                                let [prelude, main] = frag.split("////")
                                shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common> \n" + prelude)
                                shader.fragmentShader = shader.fragmentShader.replace("#include <premultiplied_alpha_fragment>", "#include <premultiplied_alpha_fragment> \n" + main)
                                /* log(shader.fragmentShader)

                                log(shader.vertexShader) */

                                prelude = vert.split("////")[0]
                                main = vert.split("////")[1]
                                shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common> \n" + prelude)
                                shader.vertexShader = shader.vertexShader.replace("#include <fog_vertex>", "#include <fog_vertex> \n" + main)
                            }
                            const random = new Float32Array(this.dustParticles.geometry.attributes.position.count)
                            for (let i = 0; i < this.dustParticles.geometry.attributes.position.array.length; i += 3) {
                                this.dustParticles.geometry.attributes.position.array[i] = this.dustParticles.geometry.attributes.position.array[i] + Math.random() * 3;
                                this.dustParticles.geometry.attributes.position.array[i + 1] = this.dustParticles.geometry.attributes.position.array[i + 1] + Math.random() * 3;
                                this.dustParticles.geometry.attributes.position.array[i + 2] = this.dustParticles.geometry.attributes.position.array[i + 2] + (Math.random() * 2 - 1) * 6;
                                random[i / 3] = Math.random()
                            }

                            this.dustParticles.geometry.setAttribute("random", new THREE.BufferAttribute(random, 1))

                            this.dustParticles.scale.multiplyScalar(this.settings.ground_scale)
                            this.dustParticles.position.y = 2000;
                            this.scene.add(this.dustParticles)
                        })
                    })

                })
            })
        }

        /* this.ground.material = new THREE.MeshBasicMaterial({
            color: 0x222222
        }) */

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

        this.bg_music_active = document.querySelector("#sound-toggle").innerText == "volume_up"
        this.bg_music = document.querySelector("#bg-music")
        this.bg_music.volume = .8
        document.querySelector("#sound-toggle").onclick = () => {
            if (document.querySelector("#sound-toggle").innerText == "volume_up") {
                document.querySelector("#sound-toggle").innerText = "volume_off"
                this.bg_music.pause()
            } else {
                document.querySelector("#sound-toggle").innerText = "volume_up"
                this.bg_music.play()
            }
        }
        this.selectedCategories = []
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

        this.interface = new AppInterface();

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


        this.tree = new TreeManager("", new THREE.Vector3())
        /* this.rule_dom = document.querySelector("#rule-set"); */
        this.ruleset = this.baseRuleSet.clone();
        this.ruleset.randomize()

        /* this.ruleset.addRule("F", "RF[RF[RF]LF[LF[LFR]]]");
        this.ruleset.addRule("[", "[LUFLUF[FFUUF]RUFF") */
        /* this.ruleset.addRule("U", "F") */


        /* this.input.dispatchEvent(new Event("input")) */
        /* this.translation_output.textContent = this.tree.turtle.alphConv(this.sentence) */
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

        this.pointer_is_down = false;
        this.pointer_moved_while_down = false;

        window.addEventListener("pointermove", e => {
            this.pointer.x = (e.clientX / innerWidth) * 2 - 1;
            this.pointer.y = -(e.clientY / innerHeight) * 2 + 1;
            /* log(this.pointer) */
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            if (this.frameCount % 10 == 0) this.MouseCast()

            if (this.pointer_is_down) this.pointer_moved_while_down = true;
        })

        window.addEventListener("pointerup", e => {

            /* log(e.button) */
            const URL = this.activeUrl;
            /* log(URL); */
            log((
                this.interface.state != "LERPING" &&
                this.postDom.style.visibility == "visible" &&
                e.button == 0 &&
                !this.pointer_moved_while_down &&
                (this.interface.mouse_target_element == this.renderer.domElement || this.interface.mouse_target_element == this.postDom)
            ))
            if (
                this.interface.state != "LERPING" &&
                this.postDom.style.visibility == "visible" &&
                e.button == 0 &&
                !this.pointer_moved_while_down &&
                (this.interface.mouse_target_element == this.renderer.domElement || this.interface.mouse_target_element == this.postDom)
            ) {
                /* window.open(URL); */
                /* this.interface.nextState = "FOCUSED";
                log(this.interface.nextState) */

                /* log(this.activeTree) */
                this.interface.enter_focus(this.activeTree)
            }
            /* log("Pointer moved while down: " + this.pointer_moved_while_down) */
            this.pointer_is_down = false;
            this.pointer_moved_while_down = false;
        })
        window.addEventListener("pointerdown", e => {
            this.pointer_is_down = true;

        })
        window.addEventListener("wheel", e => {
            /* this.preventAutoRotate(); */
        })

    }

    initPostprocess() {
        this.renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer = new THREE.EffectComposer(this.renderer);

        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(
                innerWidth,
                innerHeight
            ),
            .2, // strength
            1.6, // radius
            .12 // threshold
        );

        this.bokehPass = new THREE.BokehPass(this.scene, this.camera, {
            focus: 2000.0,
            aperture: .00000025,
            maxblur: .05,
            width: innerWidth,
            height: innerHeight,
        });
        this.bokehPass.far_aperture = .000002
        this.bokehPass.close_aperture = .0000002
        this.fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);

        /* this.saoPass = new THREE.SAOPass(this.scene, this.camera, false, true);
        this.saoPass.params.saoIntensity = .0003;
        this.saoPass.params.saoBias = 1;
        this.saoPass.params.saoKernelRadius = 10;
        this.saoPass.params.saoScale = 3; */


        /* this.outlinePass = new THREE.OutlinePass(new THREE.Vector2(innerWidth, innerHeight), this.scene, this.camera); */


        this.ssaoPass = new THREE.SSAOPass(this.scene, this.camera, innerWidth, innerHeight);
        /* this.ssaoPass. */


        /* this.taaPass = new THREE.TAARenderPass(this.scene, this.camera);
        this.taaPass.unbiased = false;
        this.taaPass.sampleLevel = 1; */

        /* this.composer.addPass(this.taaPass); */

        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(this.bokehPass);
        /* this.composer.addPass(this.taaPass); */
        /* this.composer.addPass(this.ssaoPass); */
        /* this.composer.addPass(this.fxaaPass) */
        /* this.composer.addPass(this.saoPass); */
        /* this.composer.addPass(this.outlinePass) */
    }

    initShadows() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = false
        this.renderer.shadowMap.needsUpdate = true

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
            this.connection_conditions_threshold = 0;
            this.buildTreesFromPosts()
        } else {
            this.connection_conditions_count = 0;
            this.connection_conditions_threshold = 1;

            this.socket = io("last-forest.ddns.net")
            /* this.socket = io() */
            this.connectionFailed = false;
            this.socket.on("connect", () => {
                log("Connected");
                /* if (this.connectionFailed) {
                    log("Reloading because of change")
                    window.location.reload()
                } */
            })
            this.socket.on("disconnect", () => {
                log("Disconnected !");
                this.connectionFailed = true;
            })
            this.socket.on("posts", posts => {
                this.posts = posts;
                window.localStorage.setItem("posts", JSON.stringify(this.posts))
                log(Object.keys(posts).length + " posts received and cached" /* , posts */ )

                this.interface.domController.focusInterface.build(Object.values(posts)[0])

                this.connection_conditions_count++;
                this.buildTreesFromPosts();

            })
            // this.socket.on("temperature_data", temperature_data => {
            //     this.temperature_data = temperature_data;
            //     log("temperature data received " /* , this.temperature_data */ )
            //     /* this.buildTreesFromPosts(); */
            //     this.connection_conditions_count++;
            //     this.buildTreesFromPosts();
            // })
            // this.socket.on("points", points => {
            //     log("points received ")
            //     this.points = points;
            //     window.localStorage.setItem("points", JSON.stringify(points));
            //     this.connection_conditions_count++;
            //     this.buildTreesFromPosts();
            // })
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
                        gltf.scene.children[0].children[0].material.wireframe = true;
                        gltf.scene.children[0].children[1].material.wireframe = true;
                        /* log(Object.keys(this.posts).length) */
                        this.tree_model = gltf.scene.children[0];
                        this.connection_conditions_count++;
                        this.buildTreesFromPosts()
                        break;
                    case "dead_tree":
                        gltf.scene.children[0].material.wireframe = true;
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

    async buildTreesFromPosts() {
        /* return false; */
        this.tsneSize = Math.sqrt(Object.keys(this.posts).length * this.settings.tsne_scale_multiplier);
        /* log(this.ground) */
        const raycaster = new THREE.Raycaster();
        log(this.connection_conditions_count, this.connection_conditions_threshold, " conditions")
        let removed_trees = 0
        let i = 0;
        const postCount = Object.keys(this.posts).length
        if (!this.built_trees && this.connection_conditions_count == this.connection_conditions_threshold) {
            this.buildIndexThumbnails()
            /* document.querySelector("#loading-screen-text").style.opacity = 1
            document.querySelector("#loading-screen-text").style.transition = ".2s cubic-bezier(0.165, 0.84, 0.44, 1);" */
            log("Preparing to build " + Object.values(this.posts).length + " trees")

            const sc = this.tsneSize;
            log("Calculated scale: " + sc)
            const invisible_mat = new THREE.MeshBasicMaterial({
                visible: debug.show_imposters,
                wireframe: true
            })
            log(Object.keys(this.posts).length)
            for (let post of Object.values(this.posts)) {
                if ( /* post.sentiment && post.sentiment.score */ post.tsne_coordinates) {
                    /* const t = Math.floor((i / Object.keys(this.posts).length) * this.points.length); */
                    const x = post.tsne_coordinates.x * sc
                    const z = post.tsne_coordinates.y * sc
                    /* const upvote_factor = Math.sqrt(Math.map(post.score, 300, 16000, 1, 100) * 20); */
                    const upvote_factor = Math.clamp(Math.map(post.score, 300, 16000, 1, 100), 10, 30);
                    const scale = 16 * upvote_factor;
                    const development = Math.clamp(Math.floor(Math.map(post.score, 300, 16000, 1, 6)), 1, debug.max_generation_level > 0 ? debug.max_generation_level : 10)

                    let y = -100;
                    post.sentiment = {
                        score: 1
                    }
                    let tree;
                    if (!treeTypes[post.flair]) {
                        console.warn("Tree type \"" + post.flair + "\" missing!")
                        post.flair = "Society"
                    }
                    tree = this.tree.buildTreeType(post.flair, development, post.title.concat(post.title).concat(post.title).concat(post.title))

                    /* let tree = post.sentiment.score > 0 ? this.tree_model.clone() : this.dead_tree_model.clone(); */
                    raycaster.set(
                        new THREE.Vector3(
                            x, 100, z
                        ),
                        new THREE.Vector3(0, -1, 0)
                    )
                    const intersects = raycaster.intersectObject(this.ground);
                    if (intersects.length) {
                        y = intersects[0].point.y;
                        /* log(intersects[0].point) */
                    }
                    tree.position.set(
                        x,
                        y,
                        z
                    )
                    /* tree.children[0].geometry.calculateBoundingSphere() */

                    /* const imposter = new THREE.Mesh(
                        new THREE.SphereGeometry(scale, 3, 2),
                        invisible_mat
                    )
                    imposter.userData.tree = tree;
                    this.scene.add(imposter);
                    this.tree_imposters.push(imposter)
                    imposter.position.copy(tree.children[0].geometry.boundingSphere.center.clone().multiplyScalar(scale).add(tree.position)); */

                    const outerScale = 50;

                    tree.scale.set(outerScale, outerScale, outerScale)
                    tree.children[0].scale.set(scale / outerScale, scale / outerScale, scale / outerScale)
                    /* object.updateMatrix */

                    tree.userData.scale = scale;
                    tree.userData.post = post;
                    if (!debug.aggregate) this.scene.add(tree)
                    this.trees.push(tree)
                    if (!this.trees_by_category[post.flair]) this.trees_by_category[post.flair] = []
                    this.trees_by_category[post.flair].push(tree)



                    /* try {
                        log(post.title, Math.round_to_decimal(post.sentiment.score, 1), Math.round_to_decimal(post.sentiment.magnitude, 1))
                    } catch {
                        log(post)
                    } */
                    i++;
                    /* const percentage = i / (debug.tree_build_limit > 0 ? debug.tree_build_limit : postCount) * 100;
                    document.querySelector("#loading-bar-inner").style.width = percentage + "%"
                    document.querySelector("#loading-bar-inner").innerText = percentage + "%"
                    log(document.querySelector("#loading-bar-inner").style.width) */
                    if (debug.tree_build_limit > 0 && i > debug.tree_build_limit) break;

                }
            }

            // If trees too close, push away

            this.trees.sort((a, b) => {
                a.position.x - b.position.x
            })

            for (let i = 0; i < this.trees.length - 1; i++) {
                const range = 50;
                const min = Math.clamp(i - range, 0, this.trees.length);
                const max = Math.clamp(i + range, 0, this.trees.length)
                const desired_distance = 10;

                for (let j = min; j < max; j++) {
                    const d = this.trees[i].position.distanceTo(this.trees[j].position);
                    if (d < desired_distance) {
                        /* log(d, this.trees[i].userData.post.title, i) */
                        const force = this.trees[i + 1].position.clone().sub(this.trees[i].position).normalize().
                        multiplyScalar(desired_distance);
                        if (debug.treeSeparationArrows) this.scene.add(new THREE.ArrowHelper(force, this.trees[i].position, force.length() * desired_distance / 2))
                        this.trees[i].position.add(force);
                        /* this.trees[i].scale.set(5, 5, 5) */
                        /* this.trees[i].position.y = 30 */
                    }
                }
            }
            this.built_trees = true;

            for (let t of this.trees) {
                if (!t.userData.post || !t.userData.post.sentiment || !t.userData.post.sentiment.score || !t.userData.post.title) {
                    this.scene.remove(t);
                    removed_trees++;
                }
            }
            document.querySelector("#loading-button").style.opacity = 1
            document.querySelector("#loading-button").classList.add("loading-button-flash")
            document.querySelector("#loading-button").onclick = () => {
                /* document.querySelector("#loading-screen-background").style.opacity = 0; */
                document.querySelector("#loading-bar").style.opacity = 0;
                document.querySelector("#loading-desc").style.opacity = 0;
                document.querySelector("#loading-button").style.opacity = 0;
                if (document.querySelector("#sound-toggle").innerText == "volume_up") {
                    this.bg_music.play()
                }

                setTimeout(() => {
                    document.querySelector("#loading-screen-background").style.display = "none"
                    document.querySelector("#loading-bar").style.display = "none"
                    document.querySelector("#loading-desc").style.display = "none"
                    document.querySelector("#loading-button").style.display = "none"
                }, 1300)
                setTimeout(() => {
                    document.querySelector("#loading-screen-text").style.opacity = 0
                }, 700)
                setTimeout(() => {
                    document.querySelector("#loading-screen-text").style.display = "none"
                }, 3700)
            }

            if (debug.autostart) document.querySelector("#loading-button").click()


            let vertCount = 0;

            this.trees.forEach(tree => {
                vertCount += tree.children[0].geometry.attributes.position.count
            })
            log("Successfully built " + (i - removed_trees) + " trees while removing " + removed_trees)
            log("Tree vertex: " + vertCount)
            if (debug.aggregate) log("Succesfully built aggregated geometry: ", aggregated_geometry)

            this.buildTSNEMap()
            this.computeCategoryBarycenters()
        } else {
            removed_trees++;
        }
        if (debug.aggregate) {
            const aggregated = new Float32Array(vertCount * 3)

            for (let tree of this.trees) {
                const upvote_factor = Math.map(tree.userData.post.score, 300, 16000, 1, 100);
                const scale = 1 * upvote_factor;
                /* aggregated = aggregated.concat(Array.from(tree.children[0].geometry.attributes.position.array)) */
                const vertArray = tree.children[0].geometry.attributes.position.array
                for (let i = 0; i < vertArray.length; i += 3) {
                    aggregated[i] = (vertArray[i] * scale + tree.position.x)
                    aggregated[i + 1] = (vertArray[i + 1] * scale + tree.position.y)
                    aggregated[i + 2] = (vertArray[i + 2] * scale + tree.position.z)
                }
            }
            const aggregated_positions = new THREE.BufferAttribute(aggregated, 3);
            const aggregated_geometry = new THREE.BufferGeometry();
            aggregated_geometry.setAttribute("position", aggregated_positions);
            aggregated_geometry.computeVertexNormals();

            this.aggregate = new THREE.Mesh(
                aggregated_geometry,
                new THREE.LineBasicMaterial({
                    color: "red",
                    opacity: .3,
                    transparent: true,
                    linewidth: .002,
                    vertexColors: false,
                    alphaToCoverage: false
                })
            );
            this.scene.add(this.aggregate)
        }
        /* const default_focus_tree = this.trees.find(t => {
            return (t.spheres.length > 30)
            return (t.userData.post.selftext && t.userData.post.selftext.length > 1)
        });
        log(default_focus_tree)
        this.interface.enter_focus(default_focus_tree) */
    }

    buildTSNEMap() {
        this.tsneRenderer = new TsneRegionRenderer(this.renderer, this.posts)
        this.scene.add(this.tsneRenderer.displayPlane)

        if (debug.postprocessing) {
            this.tsneRenderer.displayPlane.material.color.multiplyScalar(.68)
        }
    }

    async render() {
        this.frame_time = Date.now();
        this.time = this.clock.getElapsedTime()

        debug.postprocessing ?
            this.composer.render() :
            this.renderer.render(this.scene, this.camera);

        /* if (this.tsneRenderer) this.tsneRenderer.update() */

        const t = Math.clamp(this.camera.position.y / (this.settings.draw_distance / 3) + .2, 0, 1);
        if (this.interface && this.interface.state == "MAP") {
            /* this.fog.near = (this.settings.draw_distance - this.settings.fog_offset) * t * .85;
            this.fog.far = this.settings.draw_distance * t */
        }
        if (this.tsneRenderer) {
            this.tsneRenderer.displayPlane.material.opacity = t * .32
            /* log(t) */
        }

        /* if (this.thumbnailCam) this.renderer.render(this.thumbnailScene, this.thumbnailCam) */

        this.sun.position.copy(this.camera.position).add(new THREE.Vector3(50, 100, 50));
        this.sun.target.position.copy(this.camera.position).add(this.sun_target_offset);
        this.sun.target.updateMatrixWorld();

        if (this.interface) this.interface.update(this.dt)
        /* this.csm.update(this.camera.matrix) */

        this.postDom.style.left = this.mouse.x + 20 + "px";
        this.postDom.style.top = this.mouse.y + 20 + "px";
        if (this.mouse.x > innerWidth - 200) {
            this.postDom.style.left = this.mouse.x - 200 + "px"
        }
        /*  else if (this.mouse.x < 200) {
                    this.postDom.style.left = this.mouse.x + 200 + "px"
                } */

        if (this.mouse.y > innerHeight - 200) {
            this.postDom.style.top = this.mouse.y - this.postDom.clientHeight + "px"
        }


        /* else if (this.mouse.y < 200) {
            this.postDom.style.top = this.mouse.y + 200 + "px"
        } */



        if (this.built_trees) {
            if (this.dustParticles) this.dustParticles.userData.uniforms.time.value = this.time
            if (this.interface.fatMat.uniforms.time) this.interface.fatMat.uniforms.time.value = this.time;
            Object.keys(treeTypes).forEach(type => {
                if (treeColors[type] && treeColors[type].userData.time) {
                    treeColors[type].userData.time.value = this.time

                }
            })

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
        this.renderer.info.reset()
        this.dt = this.clock.getDelta()
    }

    MouseCast() {
        let nearbyTrees
        if (this.selectedCategories.length > 0) {
            nearbyTrees = []
            this.selectedCategories.forEach(category => {
                nearbyTrees = nearbyTrees.concat(this.trees_by_category[category])
            })
        } else {
            nearbyTrees = Object.values(this.trees)
        }

        if (this.interface.focused_mode) {
            nearbyTrees.forEach(t => {
                if (t.position.distanceTo(this.camera.position) > this.settings.focused_max_raycast_dist) {
                    nearbyTrees.splice(nearbyTrees.indexOf(t), 1)
                }
            })
        }
        log(nearbyTrees.length)


        this.mousecast.setFromCamera(this.pointer, this.camera);
        const intersects = this.mousecast.intersectObjects(nearbyTrees);
        if (intersects[0] && intersects[0].object && intersects[0].object.name != "ground" && intersects[0].distance < this.scene.fog.far + 10 &&
            (this.interface.mouse_target_element == this.renderer.domElement || this.interface.mouse_target_element == this.postDom)
        ) {

            /* log(intersects[0].object) */
            /* intersects[0].object.geometry.attributes */
            let object = intersects[0].object.parent;
            /* this.outlinePass.selectedObjects = [object] */
            object.active = true;


            /* log("found tree ", intersects[0].object) */
            /* log(intersects[0].object.parent.userData.post) */
            const post = object.userData.post;
            this.renderer.domElement.style.cursor = "pointer"
            this.postDom.style.cursor = "pointer"

            /* log(Math.round_to_decimal(post.sentiment.score)) */

            this.postDom.innerHTML = "<div id=\"tooltip-flair\" style=\"background-color: " + "#" + treeColors[post.flair].color.getHexString() + "\">" + post.flair + "</div>"
            this.postDom.innerHTML += post.title;
            /* this.postDom.innerHTML += "<br> <i>" + this.sentimentToIdiom(Math.round_to_decimal(post.sentiment.score, 2)) + "</i>"; */
            this.activeUrl = post.url;
            this.activeTree = intersects[0].object.parent;
            /* log(this.activeTree) */
            this.postDom.style.visibility = "visible";

        } else {
            this.renderer.domElement.style.cursor = "default";
            this.postDom.style.cursor = "default";
            /* if (this.outlinePass.selectedObjects[0]) {
                this.outlinePass.selectedObjects[0].active = false;
            } */
            if (!waiting_to_release_tooltip) {
                waiting_to_release_tooltip = true;
                setTimeout(() => {
                    this.postDom.style.visibility = "hidden";
                    waiting_to_release_tooltip = false;
                }, 200)
            }
            /* this.outlinePass.selectedObjects = [] */
        }

        /* const tsneTersects = this.mousecast.intersectObject(this.tsneRenderer.displayPlane);
        if (tsneTersects.length > 0) {
            log(tsneTersects[0])
        } */
    }

    buildIndexThumbnails() {
        this.thumbnails = []

        /* const width = 256;
        const height = 512;

        const thumbnailScene = new THREE.Scene()
        const thumbnailCam = new THREE.PerspectiveCamera(50, 256 / 512);
        thumbnailCam.rotation.z = Math.PI
        thumbnailCam.position.y = .5
        thumbnailCam.position.z = 4;
        const thumbnailBuffer = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });
        const pixelBuffer = new Uint8ClampedArray(width * height * 4);

        const thumbnailCanvas = document.createElement("canvas")
        thumbnailCanvas.width = width;
        thumbnailCanvas.height = height;
        const ctx = thumbnailCanvas.getContext("2d") */

        let tree;
        let typeInfos = []

        Object.entries(treeTypes).forEach(([flair, type]) => {
            /* thumbnailScene.remove(tree)
            tree = this.tree.buildTreeType(flair, 4);
            log(tree)
            thumbnailScene.add(tree);
            this.renderer.setClearAlpha(0)
            this.renderer.setRenderTarget(thumbnailBuffer)
            this.renderer.clear()
            this.renderer.render(thumbnailScene, thumbnailCam);
            
            this.renderer.readRenderTargetPixels(thumbnailBuffer, 0, 0, width, height, pixelBuffer) */

            /* let all_black = true;
            for (let val of pixelBuffer) {
                if (val != 0) all_black = false;
            }
            log("Rendered thumbnail is black: " + all_black) */

            /* const imgData = new ImageData(pixelBuffer, width, height)
            ctx.putImageData(imgData, 0, 0) */

            /* log(pixelBuffer) */
            /* this.thumbnails.push(thumbnailCanvas.toDataURL()) */
            typeInfos.push({
                color: treeTypes[flair].color,
                name: flair,
            })
        })
        /* this.renderer.setRenderTarget(null)
        this.renderer.setClearAlpha(1) */

        this.thumbnailContainer = document.createElement("div")
        this.thumbnailContainer.id = "thumbnail-container"

        this.thumbnailContainer.content = document.createElement("div")
        this.thumbnailContainer.content.id = "thumbnail-content"
        this.thumbnailContainer.appendChild(this.thumbnailContainer.content)

        log(typeInfos.length)

        for (let i = 0; i < typeInfos.length; i++) {
            const info = typeInfos[i]
            log(info.name)
            /* const img = document.createElement("img");
            img.src = t
            img.className = "thumbnail-image"
            img.setAttribute("draggable", false) */

            const imgLabel = document.createElement("div")
            imgLabel.textContent = info.name
            imgLabel.className = "thumbnail-label"

            const imgContainer = document.createElement("div");
            imgContainer.className = "thumbnail-element"
            imgContainer.style.backgroundColor = info.color
            imgContainer.type = info.name;

            this.thumbnails.push(imgLabel)

            /* imgContainer.appendChild(img) */
            imgContainer.appendChild(imgLabel)

            this.thumbnailContainer.content.appendChild(imgContainer)
        }

        document.body.appendChild(this.thumbnailContainer)
        const thumbnailSlider = new CoolSlider("thumbnail-slider", 0, 100, 0, false);
        this.interface.domController.thumbnailSlider = thumbnailSlider;
        thumbnailSlider.dom.value = "0"
        thumbnailSlider.targetValue = 0;
        thumbnailSlider.dom.oninput = e => {
            thumbnailSlider.targetValue = parseFloat(e.target.value)
        }

        this.thumbnailContainer.onmousemove = e => {
            if (this.pointer_is_down) thumbnailSlider.targetValue = Math.clamp(thumbnailSlider.targetValue - e.movementY / (innerHeight / 100), 0, 100);
        }
        this.thumbnailContainer.onwheel = thumbnailSlider.onwheel = e => {
            thumbnailSlider.targetValue = Math.clamp(thumbnailSlider.targetValue + e.deltaY / 1 / (innerHeight / 100), 0, 100);
        }
        thumbnailSlider.update = () => {
            this.thumbnailContainer.content.style.top = -parseFloat(thumbnailSlider.dom.value) * (this.thumbnailContainer.content.scrollHeight - this.thumbnailContainer.content.offsetHeight) / 100 + "px";

            const val = parseFloat(thumbnailSlider.dom.value);
            /* const diff = Math.abs(val - thumbnailSlider.targetValue); */
            /* this.targetValue = Math.sin(this.frame / 100) * 1000 */
            // if (diff > 1) {
            //     /* log(val, Math.abs(val - this.targetValue)) */
            //     const t = Math.clamp(Math.pow(diff / 1000, 2), 0.1, .2);
            //     /* log(Math.pow(diff / 100, 2), t, diff) */
            //     thumbnailSlider.dom.value = Math.lerp(val, thumbnailSlider.targetValue, t) + ""
            //     /* if (this.) */
            // } else
            if (thumbnailSlider.dom.value != thumbnailSlider.targetValue + "") {
                thumbnailSlider.dom.value = thumbnailSlider.targetValue + ""
            }
        }

        this.thumbnailContainer.onclick = e => {
            const type = e.target.parentElement.type || e.target.type;
            log(type)
            if (type == undefined) return -1

            if (e.target.parentElement.classList.contains("thumbnail-active")) {
                e.target.parentElement.classList.remove("thumbnail-active")
                if (this.selectedCategories.length == 2) {
                    this.thumbnail_dont_focus = true;
                } else {
                    this.thumbnail_dont_focus = false;
                }
                this.selectedCategories.splice(this.selectedCategories.indexOf(type), 1)

                if (this.interface.focused_mode && this.selectedCategories.length == 0) {
                    this.interface.exit_focus()
                }
                e.target.parentElement.style.boxShadow = ""

            } else {
                this.selectedCategories.push(type)
                e.target.parentElement.classList.add("thumbnail-active")
                e.target.parentElement.style.boxShadow = "0 0 12px #" + treeColors[e.target.innerText].color.getHexString()
            }

            if (this.selectedCategories.length > 0) {
                this.showOnlyCategories(this.selectedCategories)

                // Focus tree & region when single category is selected
                if (this.selectedCategories.length == 1 && !this.thumbnail_dont_focus) {
                    this.interface.enter_focus(
                        this.trees_by_category[type]
                        [Math.floor(this.trees_by_category[type].length * Math.random())])
                }
            } else {
                this.showAllTrees()
            }
        }


        // this.thumbnailContainer.button = document.createElement("div");
        // this.thumbnailContainer.button.id = "thumbnail-button"
        // this.thumbnailContainer.appendChild(this.thumbnailContainer.button)
        // this.thumbnailHidden = false;
        // this.thumbnailContainer.button.onclick = () => {

        //     if (this.thumbnailHidden) {
        //         this.thumbnailContainer.className = "thumbnail-container"
        //         /* this.thumbnailContainer.style.right = "0%" */
        //         this.thumbnailContainer.button.style.transform = ""
        //         this.thumbnailContainer.button.style.transformOrigin = "right"
        //     } else {
        //         this.thumbnailContainer.className = "thumbnail-container-hidden"
        //         this.thumbnailContainer.button.style.transform = "rotate(180deg)"
        //         this.thumbnailContainer.button.style.transformOrigin = "left"
        //         /* this.thumbnailContainer.style.right = "-6.5%" */
        //     }

        //     this.thumbnailHidden = !this.thumbnailHidden;
        // }
        // this.thumbnailContainer.button.click()

    }

    showOnlyCategories(categories) {
        for (let i = 0; i < this.trees.length; i++) {
            if (!multiCludes(this.trees[i].userData.post.flair, categories)) {
                this.trees[i].visible = false;
            } else {
                this.trees[i].visible = true
            }
        }

    }
    showAllTrees() {
        for (let i = 0; i < this.trees.length; i++) {
            this.trees[i].visible = true;
        }
    }

    setSize() {
        this.renderer.setSize(innerWidth, innerHeight);
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();

        if (this.composer) {
            this.composer.setSize(innerWidth, innerHeight);
            this.bloomPass.setSize(innerWidth, innerHeight)
            this.fxaaPass.material.uniforms.resolution.value.x = 1 / innerWidth * this.renderer.getPixelRatio();
            this.fxaaPass.material.uniforms.resolution.value.x = 1 / innerHeight * this.renderer.getPixelRatio();
            this.bokehPass.uniforms.aspect.value = innerWidth / innerHeight;
            this.bokehPass.renderTargetDepth.setSize(innerWidth, innerHeight);
            this.bokehPass.camera.aspect = innerWidth / innerHeight;
        }
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

        const sc = .0005;

        const disp = new THREE.Vector3(
            0,
            simplex.noise3d(y * sc, z * sc, x * sc) * this.settings.ground_scale / 2,
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
        return sentiment >= .9 ? "Perfect !" : sentiment >= .7 ? "Beautiful !" : sentiment >= .5 ? "Nice !" : sentiment >= .3 ? "I like it." : sentiment >= .1 ? "Good." : sentiment == 0 ? "I don't know what this means." : sentiment >= -.1 ? "Eh." : sentiment >= -.3 ? "Ouch." : sentiment >= -.5 ? "That's bad." : sentiment >= -.7 ? "That's very bad." : sentiment >= -.9 ? "Oh no !" : "Fuck."
    }

    computeTsneBoundingBox() {
        const scale = this.tsneSize;

        let min = new THREE.Vector2()
        let max = new THREE.Vector2()
        const barycenter = new THREE.Vector2()
        const posts = Object.values(this.posts);
        for (let p of posts) {
            if (p.tsne_coordinates) {
                if (p.tsne_coordinates.x < min.x) {
                    min.x = p.tsne_coordinates.x
                }
                if (p.tsne_coordinates.x > max.x) {
                    max.x = p.tsne_coordinates.x
                }
                if (p.tsne_coordinates.y < min.y) {
                    min.y = p.tsne_coordinates.y
                }
                if (p.tsne_coordinates.y > max.y) {
                    max.y = p.tsne_coordinates.y
                }
                barycenter.add(new THREE.Vector2(p.tsne_coordinates.x, p.tsne_coordinates.y))
            }
        }
        barycenter.divideScalar(posts.length)

        const center = min.clone().lerp(max, .5);

        min.multiplyScalar(scale)
        max.multiplyScalar(scale)
        center.multiplyScalar(scale)
        barycenter.multiplyScalar(scale)

        const extent = new THREE.Vector2(Math.abs(max.x - min.x), Math.abs(max.y - min.y))

        this.boundingBox = {
            min,
            max,
            center,
            barycenter,
            extent,
            scale
        }
        return this.boundingBox
    }

    computeCategoryBarycenters() {
        const categories = {}
        app.trees.forEach(tree => {
            if (categories[tree.userData.post.flair]) {
                categories[tree.userData.post.flair].position.add(tree.position)
                categories[tree.userData.post.flair].count++;
            } else {
                categories[tree.userData.post.flair] = {}
                categories[tree.userData.post.flair].position = tree.position.clone()
                categories[tree.userData.post.flair].count = 1
            }
        })
        Object.values(categories).forEach(category => {
            category.position.divideScalar(category.count)
        })
        this.categoriesBarycenters = categories
        return categories
    }
}

let app;

window.addEventListener("load", () => {
    app = window.app = new App;
    app.init()
})