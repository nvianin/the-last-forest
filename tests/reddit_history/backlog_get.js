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

const wait = (time) => {
    return new Promise((resolve) => {
        setTimeout(() => {
                resolve()
            },
            time)
    })
}

const main = async () => {
    const mongo = await new MongoClient("mongodb://localhost:27017").connect();
    const posts_db = await mongo.db("last-forest").collection("reddit");
    const posts = await posts_db.find({}).toArray()
    let post_dic = {}
    posts.forEach(post => {
        post_dic[post.permalink] = post;
    })


    // Check if duplicates exist
    for (let i = 0; i < posts.length; i++) {
        for (let j = 0; j < i; j++) {
            if (posts[i].permalink == posts[j].permalink) {
                log("duplicate", posts[i].date == posts[j].date, posts[i].title)
            }
        }
    }

    const sub = r.getSubreddit("collapse");
    const posts_backlog = await sub.getTop({
        time: "all"
    }).fetchAll();
    fs.writeFileSync("./posts_backlog.json", JSON.stringify(posts_backlog));
    log("file written")

    /* let top = await sub.getTop({
        time: "all"
    })
    while (!top.isFinished) {
        top = await top.fetchMore({
            amount: 100,
            skipReplies: true,
            append: true
        })
        await wait(100);
        log(top.length + " entries")
        log("last score: " + top[top.length - 1].score)
    }
    log(top.length + " entries total")

    fs.writeFileSync("./posts_backlog.json", JSON.stringify(top));
    */
    process.exit()
}

main();