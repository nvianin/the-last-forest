const fs = require("fs")

let posts = fs.readFileSync("./posts.json", "utf-8");
posts = JSON.parse(posts)
console.log(posts[0])