const fs = require("fs");
const mongoClient = require("mongodb").MongoClient;

const posts = JSON.parse(fs.readFileSync("posts.json"));
console.log(posts)

mongoClient.connect("mongodb://localhost:27017").then(client => {

    const db = client.db("last-forest");
    const post_collection = db.collection("reddit");
    Object.values(posts).forEach(post => {
        console.log(post)
        post_collection.insertOne(post);
    })
})