const fs = require("fs");
const https = require("https");
const log = console.log;

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

let chosen_stations = fs.readFileSync("./chosen_stations.json")
chosen_stations = JSON.parse(chosen_stations)
async function download() {

    for (let s of chosen_stations) {
        log("Waiting.")
        await sleep(5000)
        log("Downloading " + s.id + "...")
        const file = fs.createWriteStream("./stations/" + s.id + ".csv")
        https.get(
            "https://www.ncei.noaa.gov/data/global-historical-climatology-network-daily/access/" +
            s.id + ".csv", (res) => {
                log(res.statusCode, res.statusMessage)
                /* res.on("data", data => {
                    log(data)
                }) */
                res.pipe(file);
                res.on("close", () => {
                    file.close();
                    log("Downloaded " + s.id + ".");
                })
                res.on("error", e => {
                    file.close();
                    console.error(e);
                })
            }
        )
    }
}
download()