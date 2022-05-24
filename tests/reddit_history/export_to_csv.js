const {
    MongoClient
} = require("mongodb")
const fs = require("fs")
const json2csv = require("json2csv")
const log = console.log

const main = async () => {

    const fields = [
        "permalink",
        "date",
        "id",
        "media",
        "score",
        "title",
        "url",
        "uuid",
        "has_media",
        "sentiment",
        "tsne_coordinates",
        "flair",
        "text",
        "is_video",
        "self_text"
    ]
    const fieldNames = fields.map(x => {
        return x.charAt(0).toLocaleUpperCase() + x.slice(1, 10000)
    })
    log(fields, fieldNames)

    let posts = await (await new MongoClient("mongodb://localhost:27017").connect()).db("last-forest").collection("reddit").find({}).toArray()
    posts = posts.map(p => {
        delete p.text
        delete p.comments
        return p
    })
    log(posts)

    fs.writeFileSync("./posts_without_comments.json", JSON.stringify(posts))

    /* const data = json2csv.parse({
        data: posts,
        fields: fields,
        fieldNames: fieldNames
    })

    fs.writeFileSync("./posts.csv", data) */
}

main()