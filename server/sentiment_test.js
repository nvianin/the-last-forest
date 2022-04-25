const fs = require("fs");
const {
    SentimentAnalyzer
} = require("node-nlp");
const log = console.log;

const posts = JSON.parse(fs.readFileSync("./posts.json", "utf-8"))
const sentiment = new SentimentAnalyzer({
    language: "en"
});
for (let p of posts) {
    sentiment
        .getSentiment(p.title)
        .then(res => {
            log("------------------")
            log(res.vote, p.title)
        })

}