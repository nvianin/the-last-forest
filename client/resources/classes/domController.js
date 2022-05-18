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
        this.videoContainer = document.createElement("video");
        this.videoContainer.id = "focus-video"
        this.mediaContainer.appendChild(this.videoContainer)
        this.imgContainer = document.createElement("img");
        this.imgContainer.id = "focus-img"
        this.imgContainer.onclick = () => {
            open(this.post.url)
        }
        this.mediaContainer.appendChild(this.imgContainer)

        this.textContainer = document.createElement("div");
        this.textContainer.id = "focus-text"
        this.textContainer.onwheel = e => {
            e.stopPropagation()
        }
        this.container.appendChild(this.textContainer)

        this.exitButton = document.createElement("div");
        this.exitButton.id = "focus-exit";
        this.container.appendChild(this.exitButton)
        this.exitButton.onclick = () => {
            app.interface.exit_focus()
        }

        this.linkButton = document.createElement("div")
        this.linkButton.id = "focus-link"
        this.linkButton.onclick = () => {
            window.open(
                this.post.url.includes("/r/") ?
                "https://reddit.com/" + this.post.url :
                this.post.url
            )
        }

        this.container.appendChild(this.linkButton);

        this.container.style.left = "-10000px"


        document.body.appendChild(this.container)
    }

    build(post) {
        this.post = post;
        log(post)
        this.title.textContent = post.title;

        this.textContainer.innerHTML = this.formatPost(post.selftext)

        if (post.is_video) {
            log("post is video")
        } else if (post.media) {
            log("post has media", post.media)
        } else if (post.has_media) {
            if (multiCludes(post.url, [".jpg", ".png", ".webp", ".gif"])) {
                this.imgContainer.src = post.url;
                /* if (post.url.includes(""))  */
                /* this.textContainer.textContent = post */
            }
            if (multiCludes(post.url, [".mp4", ".webm", ".avi"])) {
                this.videoContainer.src = post.url;
            } else if (post.url.includes("v.redd.it")) {

            }
        } else {
            this.imgContainer.src = ""
            this.videoContainer.src = ""
        }
        /* this.linkButton.style.visibility = "visible" */
        this.linkButton.textContent = post.url;
    }

    formatPost(text) {
        text = text.replaceAll("\n", "<br>")
        /* urls = */

        return text;
    }
}

/* 


[MoveOn Petition: Free Steven Donziger](https: //sign.moveon.org/petitions/free-steven-donziger?source=rawlink&amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;utm_source=rawlink&amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;share=6bf7358e-6264-4bc0-99c3-ef740e3fb6ce)

[Chevron Toxico](https: //chevrontoxico.com/)


"Steven Donziger sued Chevron for contaminating the Amazon and won. Chevron was found guilty and ordered to pay $18,000,000,000. Yesterday, Donziger went to prison, in the what’s being called the first-ever case of corporate prosecution. 

Over three decades of drilling in the Amazon, Chevron deliberately dumped more than 16 billion gallons of toxic wastewater and 17 million gallons of crude oil into the rainforest.Chevron committed ecocide to save money— about $3 per barrel.Many experts consider it the biggest oil - related disaster in history, with the total area affected 30 times larger than the Exxon - Valdez spill.Chevron created a super - fund site in the Amazon rainforest that is estimated to be the size of Rhode Island.

Steven Donziger visited Ecuador in 1993, where he says he saw "what honestly looked like an apocalyptic disaster,"
including children walking barefoot down oil - covered roads and jungle lakes filled with oil.Industrial contamination caused local tribes to suffer from mouth, stomach, and uterine cancers, respiratory illnesses, along with birth defects and spontaneous miscarriages.

As an attorney, Donziger represented over 30, 000 farmers and indigenous Ecuadorians in a
case against Chevron and * won * .In 2011, Chevron was found guilty and ordered to pay $18 billion.Rather than accept this decision, the company vowed to fight the judgment "until Hell freezes over, and then fight it out on the ice."
Chevron has been persecuting Steven Donziger
for his involvement ever since.In an internal memo, Chevron wrote, “Our L - T[long - term] strategy is to demonize Donziger.”

Chevron sued Donziger
for 60 billion dollars, which is * the most any individual has ever been sued
for in American legal history * .Over the course of ten years, armed with a legal team numbering in the thousands, the company set out to destroy Donziger.Chevron had Donziger disbarred, froze his bank accounts, slapped him with millions in fines without allowing him a jury, forced him to wear a 24 h ankle monitor, imposed a lien on his home where he lives with his family, and shut down his ability to earn a living.Donziger has been under house arrest since August 2019.

Chevron has used its clout and advertising dollars to keep the story from being reported.“I’ ve experienced this multiple times with media, ”Donziger said.“An entity will start writing the story, spend a lot of time on it, then the story doesn’ t run.”This unprecedented legal situation is happening in New York City, the hometown of the New York Times— but the paper has yet to report on the full story.

On October 27, 2021, Donziger entered federal prison
for a six - month sentence.He had already spent over 800 days in house arrest, which is * four times longer than the maximum sentence allowed
for this charge.*Anyone who cares about the rule of law should be appalled.It is an absolute embarrassment, to our government and to our constitution, that Steven Donziger is imprisoned on US soil.

As the title states, Chevron is in the process of executing the first - ever corporate prosecution in American history.This
case sets a terrible precedent
for attorneys and activists seeking to hold oil companies liable
for pollution.Chevron is pursuing this
case— to the benefit of the entire fossil fuel industry— to dissuade future litigation that may call them to account
for their role in climate change.

[Lawyer Steven Donziger, Who Sued Chevron over“ Amazon Chernobyl, ”Ordered to Prison After House Arrest](https: //www.democracynow.org/2021/10/27/steven_donziger_judicial_harassment_from_chevron)

    [This Lawyer Went After Chevron.Now He’ s 600 Days Into House Arrest.](https: //www.motherjones.com/environment/2021/03/lawyer-steven-donziger-went-after-chevron-now-600-days-house-arrest/)

        EDIT 1: Chevron went after him with a civil RICO lawsuit(accusing him of racketeering).Their argument is that Donziger is a fraud who just wanted to extort them
        for big bucks.They’ ve been working hard to paint him as such in the media.Chevron sued him
        for $60B but then dropped the damages just weeks before because they realized it would necessitate a jury. [Judge Lewis A Kaplan](https: //nlginternational.org/newsite/wp-content/uploads/2020/09/Mirer-Kaplan-Complaint-Appendix.pdf), who had undisclosed investments in Chevron, ordered Donziger to turn over his computer to Chevron’s attorneys (with decades of client communications). Donziger argued this violated attorney-client privilege. He refused to comply so the judge charged him with contempt. US attorneys declined to pursue the charge so Judge Kaplan made the exceedingly rare move to appoint private law firm Seward and Kissel, who had Chevron as a *major* client, to prosecute him “in the name of” the US govt. Kaplan also appointed Judge Preska as presiding judge. She is the leader of the right-wing Federalist Society of which Chevron is a major “gold circle” donor. I also just learned that the handpicked prosecutor, Rita Glavin, who has financial ties to oil, has billed taxpayers nearly half a million dollars to prosecute Donziger. That’s apparently 150x higher than the norm for a misdemeanor. So many conflicts of interest. So many aspects that are simply unprecedented. 

            EDIT 2: Chevron wants this to go away quietly.They have done their best to suffocate this story. ** Chevron does not want us to draw attention to the ecocide they deliberately committed(and were literally found guilty of !) in the Amazon. ** We can foil their plans by signing the MoveOn petition below and making sure this story gets shared widely.

            EDIT 3: You can also follow him on Twitter.His handle is[@SDonziger](https: //twitter.com/sdonziger?s=21). 

                EDIT 4: I know we are all rightfully pissed off but please refrain from advocating violence in the comments.I’ m grateful to the mods
                for keeping this posted here.Let’ s not make things difficult on them.

                EDIT 5: Ok this petition had around 1 k signatures on it this afternoon… and now it’ s almost at 7 k!!!Let’ s get it over 10 k because we can.

                EDIT 6: Umm holy shit…## We made Chevron trend on Reddit.

                The mods also just
                let me know that this is the top post of all time on this subreddit and the first to get over 10 k upvotes.

                Thanks to everyone who was able to share this story far and wide.

                EDIT 7: I also want to add here that[this report](https: //chevronsglobaldestruction.com/chevrons_global_destruction_report.pdf) was released today showing that there are 70 ongoing cases in 31 countries against Chevron, and only 0.006% ($286-million) in fines, court judgements, and settlements have been paid. The company still owes another $50,500,000,000 in total globally.

                    EDIT 8: Many have asked
                    if they can send words of support.For those still interested, you may send a letter to: Steven Donziger Register No: 87103 - 054, Federal Correctional Institution Pembroke Station in Danbury, CT 06811.

                    EDIT 9: Another person who deserves to be infamous is Randy Mastro, partner at Gibson Dunn Crutcher, who represented Chevron throughout this debacle:

                    “Partners at Gibson Dunn appeared to regard the firm’ s work
                    for Chevron on the RICO matter as a major profit center.The firm reportedly received ** more than $1 billion in legal fees ** from Chevron over a period of approximately five years after an intensive marketing campaign where it fashioned itself as a“ rescue squad”
                    for corporations in legal trouble.The Chevron RICO
                    case and its related litigations, according to various sources, reportedly have ** generated the largest fee in the history of Gibson Dunn which was founded in 1890. ** Gibson Dunn and litigation partner Mastro--who personally negotiated the payments to Ecuadorian judge Alberto Guerra--were under enormous pressure to deliver Chevron“ evidence” of fraud at virtually any cost given prior promises to its leading client that it would execute what the firm called the“ kill step” against human rights litigation from foreign plaintiffs.”


                    **
                    SIGN THE PETITION!(U.S.only) **

                    [MoveOn Petition: Free Steven Donziger](https: //sign.moveon.org/petitions/free-steven-donziger?source=rawlink&amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;utm_source=rawlink&amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;share=6bf7358e-6264-4bc0-99c3-ef740e3fb6ce) 

                        If you want to learn more about this incident check out[Chevron Toxico](https: //chevrontoxico.com/) and watch the documentary [CRUDE](https://youtu.be/BvrZRvgwBS8) which can be streamed for free on YouTube.

                            If you have time, please read the[wiki on SLAPP](https: //en.m.wikipedia.org/wiki/Strategic_lawsuit_against_public_participation) which is short for strategic lawsuit against public participation. It is a maneuver used “to censor, intimidate, and silence critics by burdening them with the cost of a legal defense until they abandon their criticism or opposition.”"


*/