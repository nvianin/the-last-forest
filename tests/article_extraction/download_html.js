const log = console.log;

const {
    MongoClient
} = require("mongodb")

const request = require("request")
const fs = require("fs")

const {
    convert
} = require("html-to-text")

const main = async () => {
    const client = new MongoClient("mongodb://localhost")
    await client.connect();
    const posts_db = await client.db("last-forest").collection("reddit");
    const posts = await posts_db.find({}).toArray();
    /* log(posts) */
    let posts_with_texts = 0
    /* for (let post of posts) {
        if (post.text) posts_with_texts++;
        log(posts_with_texts + "/" + posts.length + " posts alerady have article text.")
    }
    return false; */
    let i = 0;

    for (let post of posts) {
        if (!post.text) {


            log("getting " + post.url)
            log(post.permalink.replaceAll("/", "_"))
            try {

                request({
                    uri: post.url
                }, (err, res, bod) => {
                    if (err) log(err)
                    i++
                    const text = convert(bod)

                    /* log(err)
                    log(res) */
                    /* log(text) */
                    log("received article, uploading...")
                    if (i % 5 == 0) log("-------------")
                    posts_db.updateOne({
                        permalink: post.permalink
                    }, {
                        $set: {
                            text: text
                        }
                    })
                    /* fs.writeFileSync("./pages/" + post.permalink.replaceAll("/", "_") + ".html", bod) */
                })
            } catch (e) {
                console.log("[ERROR] on link " + post.url)
                console.error(e)
            }

            /* const url = new URL(post.url)
            let content = ""
            const req = http.request({
                host: url.hostname,
                port: 80,
                path: url.pathname
            }, (res) => {
                res.on("data", chunk => {
                    content += chunk
                })
                res.on("error", e => {
                    log("__ERROR__")
                    console.error(e)
                })
                res.on("end", () => {
                    log(content)
                })
            })
            req.end() */

            /* break; */
        } else {
            log("skipping " + post.url + ", already exists.")
        }
    }
    /* process.exit() */
}

main()