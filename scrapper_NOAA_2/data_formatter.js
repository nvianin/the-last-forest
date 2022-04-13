const fs = require("fs");
const log = console.log;

let station_files = []

class Station {
    constructor() {
        this.name = "null";
        this.id;
        this.measurements = {

        }
    }
}

let files = fs.readdirSync("./stations")
files.forEach(file => {
    station_files.push(
        fs.readFileSync("./stations/" + file, "utf-8")
    );
})

let stations = {}

for (let file of station_files) {
    file = file.replaceAll("/\s+/g", "").replaceAll("\r", "");
    let lines = file.split("\n");

    let keys = lines[0].split(",")
    keys = keys.map(k => {
        return k.replaceAll("\"", "")
    })
    log(keys)

    let s = new Station();

    let k = 0;
    lines.slice(1).forEach(line => {
        let values = []
        let quoted = false;
        let charbuffer = ""
        let i = 0;
        line.split("").forEach(char => {
            if (char == "\"") {
                quoted = !quoted;
                if (!quoted) {
                    keys[i] == "NAME" ? values.push(charbuffer) : values = values.concat(charbuffer.split(","));
                    charbuffer = ""
                    i++;
                }
                return false
            }
            if (quoted) {
                charbuffer += char;
            }
        })
        /* log(keys.length) */
        log(values, values.length, keys.length)

        if (k == 0) {
            s.name = values[keys.indexOf("NAME")];
            s.id = values[keys.indexOf("STATION")];
            s.latitude = values[keys.indexOf("LATITUDE")]
            s.longitude = values[keys.indexOf("LONGITUDE")]
            s.elevation = values[keys.indexOf("ELEVATION")]
        }

        /* s.measurements[values[keys.indexOf("DATE")]] = {
            tmax: values[keys.indexOf("TMAX")],
            tmin: values[keys.indexOf("TMIN")],
            tavg: values[keys.indexOf("TAVG")]
        } */

        for (let j = 0; j < values.length; j++) {
            /* log(keys[j] + ":" + values[j]) */
        }
        k++;
    })

    log(s)



    break;
}