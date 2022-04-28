const log = console.log;
const {
    MongoClient
} = require("mongodb")
const fs = require("fs")
const crypto = require("crypto")

const mediaConditions = ["v.redd.it", ".jpg", ".jpeg", ".webm", ".webp", ".png", "i.redd.it", "imgur"]

const posts = JSON.parse(fs.readFileSync("./posts_backlog.json"))

log(posts.length + " posts fetched from local storage")

async function main() {

    const mongo = await new MongoClient("mongodb://localhost:27017").connect()
    const posts_db = await mongo.db("last-forest").collection("reddit");

    posts.forEach(post => {
        posts_db.updateOne({
            permalink: post.permalink
        }, {
            $set: {
                title: post.title,
                url: post.url,
                permalink: post.permalink,
                score: post.score,
                id: post.id,
                date: post.created_utc,
                uuid: crypto.randomUUID(),
                has_media: mediaConditions.some(i => {
                    return post.url.includes(i);
                }),
                media: post.media,
                comments: post.comments,
            }
        }, {
            upsert: true
        })
    })

    log("Successfuly uploaded posts to database")
    process.exit()
}

main()