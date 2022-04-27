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
let existing_stations = fs.readdirSync("./stations").map(s => s.replace(".csv", ""));
const stations_to_download = chosen_stations.filter(s => !existing_stations.includes(s.id))
/* log(chosen_stations[0].id);
log(existing_stations[0]) */
log("Preparing to download " + stations_to_download.length + " out of " + chosen_stations.length + " stations.");
async function download() {

    for (let s of stations_to_download) {
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