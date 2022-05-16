class DomController {
    constructor(mapControls) {
        this.mapControls = mapControls
        this.zoomSlider = new CoolSlider("zoom-slider", this.mapControls.minDistance, this.mapControls.maxDistance)
        this.zoomSlider.dom.addEventListener("input", e => {
            // Zoom slider behaviour
            const newzoom = parseFloat(e.target.value)
            this.setZoomLevel(newzoom)
            /* app.camera.position.copy(
                app.camera.position.clone().sub(this.mapControls.target).normalize().multiplyScalar(newzoom)
            ); */
        })
        this.zoomSlider.targetValue = this.zoomSlider.dom.value = this.getDistance()


        this.modeSlider = new CoolSlider("mode-slider", 0, 1000, 3)
        this.modeSlider.dom.addEventListener("input", e => {
            if (app.interface.state != "LERPING") {
                const val = parseFloat(e.target.value)
                this.modeSlider.targetValue = Math.floor(val / 333) * 500;
                if (app.interface.focused_mode) {
                    app.interface.exit_focus()

                }
            }
        })
        this.modeSlider.dom.default = 500

        const images = ["walk", "map", "auto"]
        let j = 0;
        for (let i of images) {
            let label = document.createElement("div")
            label.innerText = images[j].toUpperCase()
            label.className = "label"
            label.id = images[j]
            this.modeSlider.container.append(label)
            j++
        }

        this.currentState = "map"

        this.focusInterface = new FocusInterface()
    }

    update() {
        this.zoomSlider.update()
        this.modeSlider.update()
        if (this.thumbnailSlider) this.thumbnailSlider.update()

        const modeVal = parseFloat(this.modeSlider.dom.value);
        if (modeVal < 100) {
            this.currentState = "WALKING"
            /* log("selecting walk") */
        } else if (modeVal > 400 && modeVal < 600) {
            this.currentState = "MAP"
            /* log("selecting auto") */
        } else if (modeVal > 900) {
            this.currentState = "PROMENADE"
            /* log("selecting map") */
        }
    }

    setZoomLevel(newzoom) {
        this.mapControls.minDistance = newzoom;
        this.mapControls.maxDistance = newzoom;
        this.zoomSlider.targetValue = newzoom;
        /* this.mapControls.update() */
    }

    getDistance = () => {
        return this.mapControls.target.distanceTo(app.camera.position);
    }
}

class CoolSlider {
    constructor(id = "", min, max, steps = 0, add = true) {
        this.min = min;
        this.max = max;
        this.dom = document.createElement("input");
        this.dom.type = "range"
        this.dom.setAttribute("min", min)
        this.dom.setAttribute("max", max)
        this.dom.setAttribute("step", 1)
        this.dom.setAttribute("default", 50)
        this.dom.classList.add("cool-slider");
        if (id != "") this.dom.id = id;

        this.container = document.createElement("div");
        this.container.classList.add("cool-slider-container");
        this.container.appendChild(this.dom)
        this.container.ondragstart = e => {
            e.preventDefault()
            /* log("prevented default drag form " + e.target) */
        }
        this.dom.ondragstart = this.container.ondragstart;

        if (id != "") this.container.id = id + "-container";

        this.steps = steps;
        this.step_elements = []

        for (let i = 0; i < steps; i++) {
            const step = document.createElement("div")
            step.classList.add("slider-step")
            step.id = "slider-step-" + i
            step.ondragstart = this.dom.ondragstart;
            this.step_elements.push(step)
            this.container.appendChild(step)
        }


        this.targetValue = 500;
        this.frame = 0;
        if (add) document.body.appendChild(this.container)
    }

    update() {
        this.frame++
        const val = parseFloat(this.dom.value);
        const diff = Math.abs(val - this.targetValue);
        /* this.targetValue = Math.sin(this.frame / 100) * 1000 */
        if (diff > 5) {
            /* log(val, Math.abs(val - this.targetValue)) */
            const t = Math.clamp(Math.pow(diff / 1000, 2), 0.1, .2);
            /* log(Math.pow(diff / 100, 2), t, diff) */
            this.dom.value = Math.lerp(val, this.targetValue, t) + ""
            /* if (this.) */
        } else if (this.dom.value != this.targetValue + "") {
            this.dom.value = this.targetValue + ""
        }
    }
}

class FocusInterface {
    constructor() {
        this.container = document.createElement("div");
        this.container.id = "focus-container"

        this.title = document.createElement("div");
        this.title.id = "focus-title"
        this.title.innerText = "Title of the post"
        this.container.appendChild(this.title)

        this.mediaContainer = document.createElement("div");
        this.mediaContainer.id = "focus-media"
        this.container.appendChild(this.mediaContainer)

        this.textContainer = document.createElement("div");
        this.textContainer.id = "focus-text"
        this.container.appendChild(this.textContainer)

        this.exitButton = document.createElement("div");
        this.exitButton.id = "focus-exit";
        this.container.appendChild(this.exitButton)
        this.exitButton.onclick = () => {
            app.interface.focused_mode ?
                app.interface.exit_focus() :
                app.interface.enter_focus()
        }
        document.body.appendChild(this.container)
    }

    build(post) {
        log(post)
        this.title.textContent = post.title;
        /* if (post.url.includes(""))  */
        /* this.textContainer.textContent = post */
    }
}