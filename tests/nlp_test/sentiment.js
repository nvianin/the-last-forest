const log = console.log
const {
    MongoClient
} = require("mongodb")
const language = require("@google-cloud/language");
const language_client = new language.LanguageServiceClient();

/* const text = "Texans to see 'empty store shelves' this weekend due to Abbott border inspections"

const doc = {
    content: text,
    type: "PLAIN_TEXT"
}

client.analyzeSentiment({
    document: doc
}).then(res => {
    log(res);
    log("score:" + res.documentSentiment.score);
    log("magnitude:" + res.documentSentiment.magnitude);
}) */

const wait = time => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("")
        }, time)
    })
}

const promise = new Promise((resolve) => {
    setTimeout(() => {
        resolve("fuck you lol :D");
    }, 1000)
})

const client = new MongoClient("mongodb://localhost:27017");
/* log(reddit_db) */

async function main() {
    /* await wait(1000)
    log("waited") */

    promise.then(res => {
        console.log(res)
    })

    client.connect()
    const db = await client.db("last-forest")
    const control_db = await db.collection("control");
    const reddit_db = await db.collection("reddit");

    /* log(control_db) */
    const gapi_control = await control_db.findOne({
        name: "gapi"
    })
    log(gapi_control)

    const posts = await reddit_db.find().toArray();
    const mediaConditions = ["v.redd.it", ".jpg", ".jpeg", ".webm", ".webp", ".png", "i.redd.it", "imgur"]
    const post = posts[0]
    /* for (let post of posts) { */


    log(post.title)
    log(post._id)

    let post_sentiment_exists = false;
    let p = await reddit_db.findOne({
        url: post.url
    }).then(res => {
        if (res.sentiment) {
            post_sentiment_exists = true
        }
    }).catch(err => {
        /* log(err.message) */
    })
    log(post_sentiment_exists ? "Sentiment analysis exists, skipping..." : "Analysis post sentiment");
    let requests_this_month = (await control_db.findOne({
        "name": "gapi"
    })).requests_this_month
    log(requests_this_month)
    if (requests_this_month >= 4900) log("skipping due to token limit")

    if (!post_sentiment_exists && requests_this_month < 4900) {
        let sentiment = await language_client.analyzeSentiment({
            document: {
                content: post.title,
                type: "PLAIN_TEXT"
            }
        })
        control_db.updateOne({
            name: "gapi"
        }, {
            $inc: {
                "requests_this_month": 1
            }
        })
        log(sentiment[0].documentSentiment)
        reddit_db.updateOne({
            url: post.url
        }, {
            $set: {
                sentiment: sentiment[0].documentSentiment
            }
        }, {
            upsert: true
        })
    }
}
// posts.map(p => {
//     log(p.title, new Date(p.date * 1000))
//     let has_media = false;
//     if (mediaConditions.some(indicator => {
//             /* log(indicator, p.url, p.url.includes(indicator)) */
//             return p.url.includes(indicator)
//         })) {
//         has_media = true;
//         /* log("!!!!!!!!!!!!!!!!MEDIA URL FOUND!") */
//         log(p.url)
//     }
//     /* reddit_db.updateOne({
//         _id: p._id
//     }, {
//         $set: {
//             has_media: has_media
//         }
//     }) */
// })
/* } */
main();