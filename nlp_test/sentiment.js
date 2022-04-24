const log = console.log
const {
    MongoClient
} = require("mongodb")
/* const language = require("@google-cloud/language");
const client = new language.LanguageServiceClient();

const text = "Texans to see 'empty store shelves' this weekend due to Abbott border inspections"

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

}
main();