const log = console.log;
const mongodb = require("mongodb");
const mongo_client = new mongodb.MongoClient("mongodb://localhost");

const Utils = require("../../client/resources/classes/Utils")

/* const fs = require("fs"); */

async function main() {
    await mongo_client.connect();
    const posts = await mongo_client.db("last-forest").collection("reddit").find({}).toArray();
    for (let i = 0; i < posts.length; i++) {
        for (let j = 0; j < i; j++) {
            if (posts[i].permalink == posts[j].permalink) {
                log("duplicate", posts[i].date == posts[j].date, posts[i].title)
            }
        }
    }
    log(posts.length + " posts found")

    log("ok")

    const countDict = {}

    for (let p of posts) {
        for (word of Utils.removeDiacritics(p.title).split(" ")) {
            word = word.replaceAll(/W/g, "").toLowerCase()
            /* log(word) */
            if (countDict[word]) {
                countDict[word]++
            } else {
                countDict[word] = 1
            }
        }
    }

    sortedArray = []

    for ([word, count] of Object.entries(countDict)) {
        sortedArray.push({
            word,
            count
        })
    }

    sortedArray.sort((a, b) => {
        return a.count - b.count
    })
    sortedArray.forEach(word => log(word))
}

main()


/* 
significant words

climate
collapse
[u.s, americans]
scientists
food
global
study
report
warns
crisis
police
day
[covid, pandemic]
earth
gas
ice
record









*/