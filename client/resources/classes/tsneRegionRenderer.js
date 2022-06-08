class TsneRegionRenderer {
    constructor(renderer, posts) {
        if (app.tsneRenderer) {
            throw new Error("TsneRenderer already exists !")
        }

        app.computeTsneBoundingBox()
        log(app.boundingBox);

        for (let t of app.trees) {
            t.position.sub(new THREE.Vector3(app.boundingBox.barycenter.x, 0, app.boundingBox.barycenter.y));


            /* const scale = 
            t.position.multiplyScalar(scale) */
        }


        this.id = Math.floor((Math.random() * 0xffffff)).toString()
        this.renderer = renderer;
        this.scene = new THREE.Scene()

        this.width = 512

        this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.width / 2, -this.width / 2)
        this.camera.position.z = .1

        this.posts = Object.values(posts);

        this.side = 1024;

        this.framebuffer = new THREE.WebGLRenderTarget(this.side, this.side, {
            depthBuffer: false,
            stencilBuffer: false
        })
        this.frametex = new THREE.FramebufferTexture(this.side, this.side, THREE.RGBAFormat)
        this.frametex.magFilter = THREE.LinearFilter;
        /* this.frametex.flipY = false; */

        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(this.width, this.width),
            new THREE.ShaderMaterial({
                uniforms: {
                    tsne_map: {
                        value: this.frametex
                    },
                    side: {
                        value: this.side
                    },
                    blur_pass: {
                        value: true
                    }
                },
            })
        )
        this.scene.add(this.plane)
        this.plane.visible = false;

        this.material = this.plane.material


        this.spheres = new THREE.InstancedMesh(
            new THREE.CircleGeometry(1, 32),
            new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: .5,
            }),
            this.posts.length
        )
        /* this.spheres.position.z = -200 */
        this.scene.add(this.spheres)
        log(this.spheres.instanceMatrix, this.spheres.instanceColor)

        this.loadMaterial()

        this.displayPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1, 32, 32),
            new THREE.MeshPhysicalMaterial({
                map: this.frametex,
                depthTest: false,
                depthWrite: false,
                opacity: 1,
                transparent: true
            })
        )
        /* this.displayPlane.scale.set(app.tsneSize, app.tsneSize, app.tsneSize)
        this.displayPlane.scale.set(app.tsneSize, app.tsneSize, app.tsneSize) */
        this.displayPlane.scale.multiplyScalar(this.width * app.tsneSize)
        this.displayPlane.position.y = 10;
        this.displayPlane.rotation.x = -Math.HALF_PI
        this.displayPlane.rotation.z = Math.PI
        this.displayPlane.scale.x *= -1;
        /* this.scene.add(this.displayPlane); */
        /* this.plane.material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            wireframe: true
        }) */

        /* this.debugPlane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshBasicMaterial({
            map: this.frametex
        }))
        this.debugPlane.position.y = 300
        this.debugPlane.rotation.x = -Math.PI / 2
        app.scene.add(this.debugPlane) */

        /* this.canvas = document.createElement("canvas")
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.putImageData(this.renderer.readRenderTargetPixels()) */

        const col = new THREE.Color()
        app.renderer.getClearColor(col)
        this.backup = {
            size: new THREE.Vector2,
            ratio: app.renderer.getPixelRatio(),
            bgcolor: col
        }

        this.built = false;
    }

    async loadMaterial() {
        log("waited")
        const frag = await (await fetch("./resources/shaders/tsneRendererFrag.glsl")).text()
        this.material.fragmentShader = frag;
        this.material.needsUpdate = true
        /* log(this.material.fragmentShader) */
        this.update();
    }

    update() {
        if (this.built) return false;
        log("Updating TSNE displaymap...")
        /* let missing = 0;
        for (let i = 0; i < this.posts.length; i++) {
            if (this.posts[i].tsne_coordinates && Object.keys(treeTypes).includes(this.posts[i].flair)) {
                this.material.uniforms.posts.value[i * 2] = this.posts[i].tsne_coordinates.x
                this.material.uniforms.posts.value[i * 2 + 1] = this.posts[i].tsne_coordinates.y

                this.material.uniforms.posts_colors.value[i * 3] = treeColors[this.posts[i].flair].color.r
                this.material.uniforms.posts_colors.value[i * 3 + 1] = treeColors[this.posts[i].flair].color.g
                this.material.uniforms.posts_colors.value[i * 3 + 2] = treeColors[this.posts[i].flair].color.b
            } else {
                missing++
            }
        } */
        /* log(missing + " missing tsne coordinates.") */


        // Build instance matrix from tsne map
        const dummy = new THREE.Matrix4();
        for (let i = 0; i < this.spheres.count; i++) {
            if (treeColors[this.posts[i].flair] && this.posts[i].tsne_coordinates && this.posts[i].tree && this.posts[i].tree.visible) {
                const s = Math.clamp(this.posts[i].score / 3000, .3, 2)
                /* const s = 1 */
                dummy.compose(
                    new THREE.Vector3(this.posts[i].tsne_coordinates.x - app.boundingBox.barycenter.x / app.boundingBox.scale, this.posts[i].tsne_coordinates.y - app.boundingBox.barycenter.y / app.boundingBox.scale, 0),
                    /* new THREE.Vector3(this.posts[i].tree.position.x - app.boundingBox.barycenter.x / app.boundingBox.scale, this.posts[i].tree.position.z - app.boundingBox.barycenter.y / app.boundingBox.scale, 0), */
                    new THREE.Quaternion(),
                    new THREE.Vector3(s, s, s)
                )
                this.spheres.setMatrixAt(i, dummy)
                this.spheres.setColorAt(i, new THREE.Color(treeColors[this.posts[i].flair].color))
            }
        }
        /* this.spheres.instanceColor.needsUpdate =
            this.spheres.instanceMatrix.needsUpdate = true */

        // Backup renderer parameters
        this.renderer.getSize(this.backup.size)
        this.backup.ratio = this.renderer.getPixelRatio()

        // Set renderer to square
        this.renderer.setSize(this.side, this.side)
        this.renderer.setPixelRatio(1)
        this.renderer.setClearColor(0x000000)
        this.renderer.setClearAlpha(0)
        this.renderer.setRenderTarget(this.framebuffer)


        this.renderer.render(this.scene, this.camera)
        // Framebuffer to texture
        this.renderer.copyFramebufferToTexture(new THREE.Vector2, this.frametex)

        this.material.uniforms.blur_pass.value = true;
        //Blur multiple times
        this.plane.visible = true;
        for (let i = 0; i < 26; i++) {
            this.renderer.render(this.scene, this.camera)
            this.renderer.copyFramebufferToTexture(new THREE.Vector2, this.frametex)
        }

        this.material.uniforms.blur_pass.value = false;
        // Turn on post-processing square
        this.renderer.clear()
        this.renderer.render(this.scene, this.camera)
        this.renderer.copyFramebufferToTexture(new THREE.Vector2, this.frametex)

        // Reset renderer parameters
        this.plane.visible = false;
        this.renderer.setSize(this.backup.size.x, this.backup.size.y)
        this.renderer.setPixelRatio(this.backup.ratio)
        this.renderer.setRenderTarget(null)
        this.renderer.setClearColor(this.backup.bgcolor)
        this.renderer.setClearAlpha(1)


        log("TSNE displaymap updated from " + this.id)
        log(this)
        this.built = true
    }

    generateImage() {

    }
}