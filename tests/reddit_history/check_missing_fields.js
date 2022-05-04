const {
    MongoClient
} = require("mongodb")
const log = console.log

const main = async () => {
    const posts = await (await new MongoClient("mongodb://localhost").connect()).db("last-forest").collection("reddit").find({}).toArray()
    for (post of posts) {
        if (post.score == undefined || post.flair == undefined || ) {
            log(post.score)
        }
    }

}

main()