const log = console.log
const {
    MongoClient
} = require("mongodb")
const fs = require("fs")

const main = async () => {

    let coords = fs.readFileSync("./coord_euclidean.csv", "utf-8")
    coords = coords.split("\r\n")
    coords = coords.map(c => {
        return c.split(",")
    })
    let titles = fs.readFileSync("./title_minkowski.csv", "utf-8")
    titles = titles.split("\r\n")
    let new_titles = fs.readFileSync("./finalTitles.csv", "utf-8")
    new_titles = new_titles.split("\r\n")

    const client = await new MongoClient("mongodb://localhost:27017").connect()
    const post_db = client.db("last-forest").collection("reddit");
    const posts = await post_db.find({}).toArray()
    /* log(post_db) */
    log(titles)
    log((await post_db.findOne({
        title: titles[0]
    })))

    const scale = .1
    let successCount = 0;
    for (let i = 0; i < coords.length; i++) {
        log("=================")
        /* log(titles[i]) */
        log(posts[i].title)
        log(new_titles[i])
        log(parseFloat(coords[i][0]) * scale, parseFloat(coords[i][1]) * scale)
        const resp = await post_db.updateOne({
            title: posts[i].title
        }, {
            $set: {
                tsne_coordinates: {
                    x: parseFloat(coords[i][0]) * scale,
                    y: parseFloat(coords[i][1]) * scale
                }
            }
        })
        log(resp)
        if (resp.matchedCount && resp.modifiedCount) successCount++;
    }
    log(`Uploaded ${successCount} out of ${coords.length} coordinates`)
    process.exit()
}

main()