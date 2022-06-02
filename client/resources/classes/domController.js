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

            step.onclick = () => {
                this.targetValue = (this.max - this.min) / (this.steps - 1) * i;
            }
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

        this.flairContainer = document.createElement("div");
        this.flairContainer.id = "focus-flair"
        this.container.appendChild(this.flairContainer)

        this.dateContainer = document.createElement("div");
        this.dateContainer.id = "focus-date"
        this.container.appendChild(this.dateContainer)

        this.separator = document.createElement("div")
        this.separator.className = "focus-separator"
        this.container.appendChild(this.separator)

        /* this.mediaContainer = document.createElement("div");
        this.mediaContainer.id = "focus-media"
        this.container.appendChild(this.mediaContainer)
        this.videoContainer = document.createElement("video");
        this.videoContainer.id = "focus-video"
        this.mediaContainer.appendChild(this.videoContainer)
        this.imgContainer = document.createElement("img");
        this.imgContainer.id = "focus-img"
        this.imgContainer.onclick = () => {
            open(this.post.url)
        } 
        this.mediaContainer.appendChild(this.imgContainer)
        */


        this.exitButton = document.createElement("div");
        this.exitButton.id = "focus-exit";
        this.container.appendChild(this.exitButton)
        this.exitButton.onclick = () => {
            app.interface.exit_focus()
        }


        this.postContainer = document.createElement("div");
        this.postContainer.className = "focus-post"
        this.container.appendChild(this.postContainer)


        /* this.textContainer = document.createElement("div");
        this.textContainer.id = "focus-text"
        this.textContainer.onwheel = e => {
            e.stopPropagation()
        }
        this.postContainer.appendChild(this.textContainer) */

        this.redditButton = document.createElement("div");
        this.redditButton.id = "focus-reddit"
        this.redditButton.textContent = "reddit"
        this.container.appendChild(this.redditButton)
        this.redditButton.onclick = () => {
            window.open("https://reddit.com" + this.post.permalink)
        }

        /* this.linkContainer = document.createElement("div");
        this.linkContainer.id = "focus-link-container"
        this.postContainer.appendChild(this.linkContainer) */

        /*     this.linkButton = document.createElement("div")
                this.linkButton.id = "focus-link"
                this.linkButton.onclick = () => {
                    window.open(
                        this.post.url.includes("/r/") ?
                        "https://reddit.com/" + this.post.url :
                        this.post.url
                    )
                }
                this.linkContainer.appendChild(this.linkButton); */

        this.focusText = document.createElement("div")
        this.focusText.id = "focus-selftext"
        this.postContainer.appendChild(this.focusText)


        document.body.appendChild(this.container)
        this.container.style.left = "-10000px"
    }

    build(post) {
        this.post = post;
        log(post)
        this.title.textContent = post.title;
        /* try {
            this.textContainer.innerHTML = this.formatPost(post.selftext)
        } catch {
            this.textContainer.innerHTML = post.selftext
        } */
        /* this.imgContainer.src = ""
        this.videoContainer.src = "" */
        this.flairContainer.innerText = post.flair
        this.flairContainer.style.backgroundColor = this.postContainer.style.backgroundColor = "#" + treeColors[post.flair].color.getHexString()
        this.focusText.innerText = ""

        const d = new Date(post.date * 1000)
        /* this.dateContainer.innerText = d.toLocaleString() */
        this.dateContainer.innerText =
            (d.getDate() + "").padStart(2, "0") +
            "/" +
            ((d.getMonth() + 1) + "").padStart(2, "0") +
            "/" +
            (d.getFullYear() + "").slice(2, 4)


        if (post.is_video) {
            this.focusText.innerText = "\n This post is a video."
        } else if (post.media) {
            log("post has media", post.media)
        } else if (post.has_media) {
            if (multiCludes(post.url, [".jpg", ".png", ".webp", ".gif"])) {
                this.focusText.innerText = "This post is an image."
            }
            if (multiCludes(post.url, [".mp4", ".webm", ".avi"])) {
                this.focusText.innerText = "This post is a video."
            } else if (post.url.includes("v.redd.it")) {
                this.focusText.innerText = "This post is a video."
            }
        } else if (post.selftext && post.selftext.length > 0) {
            this.focusText.innerText = post.selftext
        } else if (!post.url.includes("/r/")) {
            this.focusText.innerText = "This post is a link."
        }
        this.postContainer.onclick = () => {
            window.open(
                post.url.includes("/r/") ?
                "https://reddit.com" + post.permalink :
                post.url
            )
        }
        /* this.linkButton.style.visibility = "visible" */
        if (post.url.includes("/r/")) {
            this.redditButton.style.display = "none"
        } else {
            this.redditButton.style.display = "block"
        }

        this.postContainer.innerText
    }

    formatPost(text) {

        let links = {}
        text = text.replaceAll("\n", " <br> ")

        for (let i = 0; i < text.length; i++) {
            const char = text[i]
            if (char == "[") {
                let error = false;
                let word = "" + char

                let j = 1;
                while (!word.includes(")")) {
                    if (text[i + j] == "]") {
                        if (text[i + j + 1] != "(") {
                            error = true;
                        }
                    }

                    word += text[i + j]
                    j++
                }
                if (!error) {
                    /* log(word) */
                    let [text, link] = word.slice(1, -1).split("](")
                    /* log(text, link) */
                    if (link.includes("http") || link.includes("https")) {
                        links[text] = link
                    }
                }
            }
        }
        /* log(links) */
        for (let [link_text, link] of Object.entries(links)) {
            /* log("-------------------")
            log(text + ": " + link) */

            text = text.replaceAll(("[" + link_text + "](" + link + ")"), ("<a href=" + link + " target=\"_blank\">" + link_text + "</a>"))
        }

        /* urls = */

        return text;
    }
}