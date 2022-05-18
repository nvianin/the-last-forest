const log = console.log
const fs = require("fs")

const main = () => {
    let links = {}
    let text = fs.readFileSync("./commentlinktest.txt", "utf-8")
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

        text = text.replaceAll(("[" + link_text + "](" + link + ")"), ("<a href=" + link + ">" + link_text + "</a>"))
    }
    log(text)
    log(links)
}

main()