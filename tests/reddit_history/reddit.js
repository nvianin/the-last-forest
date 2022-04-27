const snoowrap = require("snoowrap")
const {
    MongoClient
} = require("mongodb")
const fs = require("fs");
const credentials = fs.readFileSync("../../server/credentials");
const r = new snoowrap({
    userAgent: "web:the-last-forest:v0.1 (by /u/TheJack77)",
    clientId: "o3H2m8ptoKpkMLONCyeVOQ",
    clientSecret: credentials,
    refreshToken: "21094068-J9uGeSOePPqNG2nndgl6ljbIf_hazQ"
})

const main = async () => {
    const mongo = await new MongoClient("mongodb://localhost:27017").connect();

}

main();