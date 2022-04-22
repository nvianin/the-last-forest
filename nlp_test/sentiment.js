const language = require("@google-cloud/language");
const client = new language.LanguageServiceClient();

const text = "Texans to see 'empty store shelves' this weekend due to Abbott border inspections"

const doc = {
    content: text,
    type: "PLAIN_TEXT"
}

const [result] = client.analyzeSentiment({
    document: document
})