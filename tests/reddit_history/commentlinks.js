const log = console.log
const fs = require("fs")

const main = async () => {
    let text = fs.readFileSync("./commentlinktest.txt", "utf-8")
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
        const word = words[i]
        if (word.includes("[") /* || word.includes("[") || word.includes("(") || word.includes(")") */ ) {
            console.log("-----------")
            log(word)
            if (!word.includes(")")) {
                let j = i + 1;
                while (!words[j].includes(")")) {
                    log(words[j])
                    j++
                }
            }
        }
    }
}

main()