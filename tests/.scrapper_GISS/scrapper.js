const https = require("https");
const fs = require("fs");
const log = console.log;


/* let url = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv"

https.get(url, res => {
    log(res.statusCode, res.statusMessage)
    res.on("data", data => {
        log(data.toString());
    })
    res.on("error", e => {
        console.error(e);
    })
}) */
let currentYear = new Date().getFullYear();
let years = {}

let data = fs.readFileSync("./GISTEMP.csv", "utf-8")
parseGISTEMP(data);

function parseGISTEMP(data) {
    data = data.split("\n");
    for (let line of data) {
        if (line[0] != "#" && parseInt(line[0])) {
            line = line.split(",")
            years[line[0]] = line.slice(1, 13);
        }
    }

    log(years)
}