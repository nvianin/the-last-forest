class DomController {
    constructor() {
        this.zoomSlider = new CoolSlider("zoom-slider")
        this.modeSlider = new CoolSlider("mode-slider")

    }
}

class CoolSlider {
    constructor(id = "") {
        this.dom = document.createElement("input");
        this.dom.type = "range"
        this.dom.setAttribute("min", 10)
        this.dom.setAttribute("max", 90)
        this.dom.setAttribute("step", 1)
        this.dom.setAttribute("default", 50)
        this.dom.classList.add("cool-slider");
        if (id != "") this.dom.id = id;

        this.container = document.createElement("div");
        this.container.classList.add("cool-slider-container");
        this.container.appendChild(this.dom)

        if (id != "") this.container.id = id + "-container";

        document.body.appendChild(this.container)
    }
}