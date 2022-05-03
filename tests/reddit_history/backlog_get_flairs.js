const log = console.log
const snoowrap = require("snoowrap")
const {
    MongoClient
} = require("mongodb")
const fs = require("fs");
const credentials = fs.readFileSync("../../server/credentials", "utf-8");
const r = new snoowrap({
    userAgent: "web:the-last-forest:v0.1 (by /u/TheJack77)",
    clientId: "o3H2m8ptoKpkMLONCyeVOQ",
    clientSecret: credentials,
    refreshToken: "21094068-J9uGeSOePPqNG2nndgl6ljbIf_hazQ"
})

client = new MongoClient("mongodb://localhost")

const main = async () => {

    await client.connect()
    const posts_db = await client.db("last-forest").collection("reddit")
    const posts = await posts_db.find({}).toArray()
    /* log(posts) */
    let i = 0
    /* r.getSubreddit("collapse").getLinkFlairTemplates().then((fulfill, error) => {
        if (error) {
            log(error)
        } else {
            log(fulfill)
        }
    }) */
    /* log(flairs) */
    /* return true */
    for (p of posts) {
        if (p.flair) {
            /* log("post flair " + p.flair + " already exists, skipping...") */
        } else {
            const flair = await r.getSubmission(p.id).link_flair_text
            log("-------------")
            log(p.title)
            log(flair)
            log(i + " out of " + posts.length + " posts flair parsed")

            posts_db.updateOne({
                "id": p.id
            }, {
                "$set": {
                    "flair": flair
                }
            })
        }
        /* break; */
        i++;
    }

    process.exit()

}

main()