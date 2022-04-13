const fs = require("fs");
const csv = require("csv-parser")
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
for (let file of files) {
    let measurements = {}
    let s = new Station();
    fs.createReadStream("./stations/" + file)
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
            ended++;
            log(ended + "/" + files.length + " stations analyzed")
            if (ended >= files.length) {
                fs.writeFileSync("./stations_measurements.json", JSON.stringify(stations));
            }
        })
    k++
    /* if (k == files.length * 2 + 1) {
        break;
    } */
    log(k + "/" + files.length + " files opened")
}