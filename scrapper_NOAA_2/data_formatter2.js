const fs = require("fs");
const csv = require("csv-parser")
const {
    pipeline
} = require("stream/promises")
const log = console.log;

class Station {
    constructor() {
        this.name = "null";
        this.id;
        this.measurements = {

        }
    }
}

let stations = {}

let files = fs.readdirSync("./stations")
let k = 0;
let ended = 0;
let active = 0;
let streams = []

for (let file of files) {
    let measurements = {}
    let s = new Station();

    const stream = fs.createReadStream("./stations/" + file)
        .pipe(csv())
        .on("data", row => {
            /* log(row) */
            if (!s.id) {
                s.id = row["STATION"]
                s.name = row["NAME"]
                s.latitude = parseFloat(row["LATITUDE"])
                s.longitude = parseFloat(row["LONGITUDE"])
                s.elevation = parseFloat(row["ELEVATION"])
            }

            s.measurements[row["DATE"]] = {
                tmax: parseFloat(row["TMAX"]),
                tmin: parseFloat(row["TMIN"]),
                tavg: parseFloat(row["TAVG"])
            }

            stations[s.id] = s;
            /* log("-----------") */
        })
        .on("end", () => {
            /* log("end", Object.keys(stations).length) */
            /* log(Object.keys(stations)) */
            active--
            ended++;
            log(ended + "/" + files.length + " stations analyzed")
            if (ended >= files.length) {
                fs.writeFileSync("./stations_measurements.json", JSON.stringify(stations));
            }
        })
    stream.pause();
    streams.push(stream);
    k++
    /* if (k == files.length * 2 + 1) {
        break;
    } */
    log(k + "/" + files.length + " files opened")
}

log(streams[0].active)


let tick = () => {
    log(active, streams.length)
    if (active < 10) {
        active++
        streams.pop().resume()

    }
    if (streams.length == 0) clearInterval(tick_interval);
}

const tick_interval = setInterval(tick, 100);