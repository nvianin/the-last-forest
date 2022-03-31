const fs = require("fs");
const snoowrap = require("snoowrap");

const credentials = fs.readFileSync("./credentials", "utf-8");

const r = new snoowrap({
    userAgent: "web:the-last-forest:v0.1 (by /u/TheJack77)",
})