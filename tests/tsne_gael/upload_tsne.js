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

    const client = await new MongoClient("mongodb://localhost:27017").connect()
    const post_db = client.db("last-forest").collection("reddit");
    /* log(post_db) */
    log((await post_db.findOne({
        title: titles[0]
    })).tsne_coordinates)

    const scale = .1

    for (let i = 0; i < coords.length; i++) {
        log(parseFloat(coords[i][0]) * scale, parseFloat(coords[i][1]) * scale)
        await post_db.updateOne({
            title: titles[i]
        }, {
            $set: {
                tsne_coordinates: {
                    x: parseFloat(coords[i][0]) * scale,
                    y: parseFloat(coords[i][1]) * scale
                }
            }
        })
    }

    log()
}

main()