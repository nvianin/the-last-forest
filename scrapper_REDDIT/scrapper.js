const fs = require("fs");
const snoowrap = require("snoowrap");

const credentials = fs.readFileSync("./credentials", "utf-8");

const r = new snoowrap({
    userAgent: "web:the-last-forest:v0.1 (by /u/TheJack77)",
    clientId: "o3H2m8ptoKpkMLONCyeVOQ",
    clientSecret: credentials,
    refreshToken: "21094068-J9uGeSOePPqNG2nndgl6ljbIf_hazQ"
})

let sub = r.getSubreddit("collapse");
log(sub)