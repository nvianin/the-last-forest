const log = console.log;
const mongodb = require("mongodb");
const mongo_client = new mongodb.MongoClient("mongodb://localhost");

const Utils = require("../../client/resources/classes/Utils")

const fs = require("fs");

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
        flair = p.flair;
        /* word = word.replaceAll(/W/g, "").toLowerCase() */
        /* log(word) */
        if (countDict[flair]) {
            countDict[flair]++
        } else {
            countDict[flair] = 1
        }
    }


    sortedArray = []

    for ([flair, count] of Object.entries(countDict)) {
        sortedArray.push({
            flair,
            count
        })
    }

    sortedArray.sort((a, b) => {
        return a.count - b.count
    })
    sortedArray.forEach(flair => log(flair))
    log(sortedArray.length + " flairs")
    fs.writeFileSync("flairs.json", JSON.stringify(sortedArray))
    process.exit()
}

main()


/* 
{
    flair: 'Shitpost',
    count: 1
} {
    flair: 'Historical',
    count: 1
} {
    flair: "It's Friday where they are",
    count: 1
} {
    flair: 'Shitpost Friday',
    count: 1
} {
    flair: 'Funny & Sad',
    count: 1
} {
    flair: 'Migration',
    count: 2
} {
    flair: 'Support',
    count: 3
} {
    flair: 'Science',
    count: 6
} {
    flair: 'null',
    count: 8
} {
    flair: 'Adaptation',
    count: 11
} {
    flair: 'Resources',
    count: 12
} {
    flair: 'Energy',
    count: 12
} {
    flair: 'Water',
    count: 13
} {
    flair: 'Diseases',
    count: 15
} {
    flair: 'Infrastructure',
    count: 15
} {
    flair: 'Predictions',
    count: 21
} {
    flair: 'Food',
    count: 22
} {
    flair: 'Low Effort',
    count: 23
} {
    flair: 'Meta',
    count: 24
} {
    flair: 'Pollution',
    count: 25
} {
    flair: 'Coping',
    count: 29
} {
    flair: 'COVID-19',
    count: 37
} {
    flair: 'Ecological',
    count: 37
} {
    flair: 'Politics',
    count: 43
} {
    flair: 'Conflict',
    count: 50
} {
    flair: 'Systemic',
    count: 56
} {
    flair: 'Society',
    count: 92
} {
    flair: 'Humor',
    count: 94
} {
    flair: 'Economic',
    count: 122
} {
    flair: 'Casual Friday',
    count: 144
} {
    flair: 'Climate',
    count: 175
}








*/