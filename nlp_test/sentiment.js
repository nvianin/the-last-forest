const log = console.log
const language = require("@google-cloud/language");
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
})