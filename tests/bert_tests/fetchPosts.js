const log = console.log;
const mongodb = require("mongodb");
const mongo_client = new mongodb.MongoClient("mongodb://localhost");

const fs = require("fs");

async function main() {
    await mongo_client.connect();
    const posts = await mongo_client.db("last-forest").collection("reddit").find({}).toArray();
    log(posts.length + " posts found")
    fs.writeFileSync("./posts.json", JSON.stringify(
        posts
    ));
    log("ok")

}

main()