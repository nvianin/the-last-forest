const fs = require("fs");

const log = console.log;

const {
    MongoClient
} = require("mongodb");





this.posts = {}

this.client = new MongoClient("mongodb://localhost:27017");
this.client.connect().then(async client => {
    log("Database connected...")
    this.db = this.client.db("last-forest");
    this.reddit_db = this.db.collection("reddit");
    log("Collection loaded...")
    let posts = await this.reddit_db.find().toArray()
    log("Posts fetched, loading...")
    fs.writeFileSync("./posts.json", JSON.stringify(posts));
    log("Write complete.")

    // DEBUG: REMOVES THE WHOLE REDDIT DB
    /* this.reddit_db.deleteMany({}); */
});