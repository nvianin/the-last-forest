class TutorialController {
    constructor() {
        this.state = {
            "map": false,
            "walk": false,
            "auto": false,
            "thumbnails": false,
            "version": 1
        }

        const preexisting_state = JSON.parse(localStorage.getItem("tutorial"))
        if (preexisting_state && debug.save_tutorial_state && this.state.version == preexisting_state.version) {
            this.state = preexisting_state
        }

        this.buildTutorials()
        this.hideAll();
    }

    tickTutorial(tutorialName) {
        this.state[tutorialName] = true;
        localStorage.setItem("tutorial", JSON.stringify(this.state))
    }

    hideAll() {
        for (let c of this.tutorialContainer.childNodes) {
            c.style.display = "none"
        }
    }

    changeState(state) {
        for (let c of this.tutorialContainer.childNodes) {
            c.style.display = "none"
        }
        switch (state) {
            case "MAP":

                if (!this.state.map) {
                    this.tutorialContainer.querySelector("#tutorial-map").style.display = "block"
                }
                if (!this.state.thumbnails) {
                    this.tutorialContainer.querySelector("#tutorial-thumbnails").style.display = "block"
                }
                break;

            case "WALKING":
                if (!this.state.walk) {
                    this.tutorialContainer.querySelector("#tutorial-walk").style.display = "block"
                }
                break;
            case "PROMENADE":
                if (!this.state.auto) {
                    this.tutorialContainer.querySelector("#tutorial-promenade").style.display = "block"
                }
                break;
        }
    }

    buildTutorials() {

        const tutorial_resources = {
            "map-01": "map",
            "thumbnails-01": "thumbnails",
            "walk-01": "walk",
            "promenade-01": "auto"
        }

        this.tutorialContainer = document.createElement("div");
        this.tutorialContainer.id = "tutorial-container"
        document.body.appendChild(this.tutorialContainer);

        Object.entries(tutorial_resources).forEach(([resource, state]) => {
            log(`Building tutorial entry for ${state} with resource ${resource}`)

            const tutorial = document.createElement("div")
            tutorial.className = "tutorial-element"
            tutorial.id = "tutorial-" + resource.slice(0, -3)

            const tutorial_img = document.createElement("img")
            tutorial_img.src = "./resources/tutorials/" + resource + ".svg"
            tutorial.appendChild(tutorial_img)

            tutorial.onclick = () => {
                this.tickTutorial(state)
                tutorial.style.transition = ".7s cubic-bezier(0.165, 0.84, 0.44, 1)"
                tutorial.style.opacity = 0;
                setTimeout(() => {
                    tutorial.style.display = "none"
                }, 700)
            }
            this.tutorialContainer.appendChild(tutorial)
        })

    }
}