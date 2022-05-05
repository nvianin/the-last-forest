class DomController {
    constructor(mapControls) {
        this.mapControls = mapControls
        this.zoomSlider = new CoolSlider("zoom-slider", this.mapControls.minDistance, this.mapControls.maxDistance)
        this.zoomSlider.dom.addEventListener("input", e => {
            // Zoom slider behaviour
            const newzoom = parseFloat(e.target.value)
            this.mapControls.minDistance = newzoom;
            this.mapControls.maxDistance = newzoom;
            this.zoomSlider.targetValue = newzoom;
            /* app.camera.position.copy(
                app.camera.position.clone().sub(this.mapControls.target).normalize().multiplyScalar(newzoom)
            ); */
        })


        this.modeSlider = new CoolSlider("mode-slider", 1, 1000, 0)
        this.modeSlider.dom.addEventListener("input", e => {
            const val = parseFloat(e.target.value)
            this.modeSlider.targetValue = Math.ceil(val / 333);
        })

    }

    update() {
        this.zoomSlider.update()
        /* this.modeSlider.update() */
    }
}

class CoolSlider {
    constructor(id = "", min, max, steps = 0) {
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

        if (id != "") this.container.id = id + "-container";

        for (let i = 0; i < steps; i++) {
            const step = document.createElement("div")
            step.classList.add("slider-step")
            step.id = "slider-step-" + i
            this.container.appendChild(step)
        }

        this.targetValue = 499;
        this.frame = 0;

        document.body.appendChild(this.container)
    }

    update() {
        this.frame++
        const val = parseFloat(this.dom.value);
        /* this.targetValue = Math.sin(this.frame / 100) * 1000 */
        if (Math.abs(val - this.targetValue) > .1) {
            log(val, Math.abs(val - this.targetValue))
            this.dom.value = Math.lerp(val, this.targetValue, .1) + ""
        }
    }
}