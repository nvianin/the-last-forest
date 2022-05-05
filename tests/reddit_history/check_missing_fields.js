const {
    MongoClient
} = require("mongodb")
const log = console.log

const conditions = [
    "score",
    "flair",
    "tsne_coordinates"
]

const main = async () => {
    const posts = await (await new MongoClient("mongodb://localhost").connect()).db("last-forest").collection("reddit").find({}).toArray()
    const missing = {}
    let missing_fields = 0
    let posts_with_incomplete_data = 0;

    for (post of posts) {
        const missing_conditions = [];
        for (let condition of conditions) {
            let incomplete = false;
            if (!post[condition]) {
                missing_conditions.push(condition)
                missing_fields++;
                incomplete = true;
            }
            if (incomplete) posts_with_incomplete_data++;
        }
        if (missing_conditions.length > 0) missing[post.permalink] = missing_conditions
    }

    log(missing)
    log("Incomplete posts:" + posts_with_incomplete_data + " with " + missing_fields + " missing fields.")
    log("Watched fields: " + conditions.join(", "))
    process.exit()

}

main()