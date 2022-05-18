const log = console.log
const fs = require("fs")

const main = async () => {
    let text = fs.readFileSync("./commentlinktest.txt", "utf-8")
    let in_bracket = false;
    let last_element = ""

    for (char of text.split(" ")) {
        console.log(char)

        if (char == "(" && last_element == "]") {
            log("In link")
        }
    }
}

main()