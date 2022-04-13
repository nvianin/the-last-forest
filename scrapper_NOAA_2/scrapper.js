const fs = require("fs");
const https = require("https");
const log = console.log;

/* const baseUrl = "https://www.ncdc.noaa.gov/cdo-web/api/v2/"
let adress = baseUrl + "data?datasetid=GSOY" + "&startdate=1763-01-01" + "&enddate=2022-12-31" + "&datatypeid="
https.get() */


let stations_inventory = fs.readFileSync("./stations_inventory.txt", "utf-8").split("\n");
/* stations[0] = stations[0].replace(/\s+/g, ',')
log(stations[0]); */

class Capability {
    constructor(name, start, end) {
        this.name = name;
        this.start = start;
        this.end = end;
        this.range = end - start;
    }
}
class Station {
    constructor(id = 0, latitude = 0, longitude = 0, elevation = 0, name = "null") {
        this.id = id;
        /* this.latitude = latitude;
        this.longitude = longitude;
        this.elevation = elevation; */
        this.capabilities = []
        this.name = name;
    }
}

let stations = {}

let objects = []
let object = ""

stations_inventory.forEach(s => {
    s = s.replace("\r", " ");
    s = s.split(/ +/g)
    /* const d = new Station(
        s[0], s[1], s[2], s[3],
        s.slice(4, s.length)
        .join(" ")
        .replace("GSN", "")
        .replace(/[0-9]/g, "").trimEnd()); */
    /* log(s) */
    if (s[3] == "TAVG") {
        let c = new Capability(s[3], s[4], s[5]);
        if (!stations[s[0]]) {
            let station = new Station(s[0]);
            stations[s[0]] = station;
        }
        stations[s[0]].capabilities.push(c)
    }

})
let chosen_stations = []
Object.values(stations).forEach(s => {
    /* log(s.capabilities[0].range) */
    if (s.capabilities[0].range > 80) {
        chosen_stations.push(s);
        log(s.id)
        /* log(s.capabilities[0]) */
    }
})

fs.writeFileSync("./chosen_stations.json", JSON.stringify(chosen_stations))

log(chosen_stations.length)

/* log("\n" + Object.keys(stations).length + " stations") */

let counted_capabilities = {}

// Object.values(stations).forEach(s => {
//     log(s)
//     s.capabilities.forEach(c => {
//         /*         log(c) */
//         if (counted_capabilities[c.name]) {
//             counted_capabilities[c.name]++
//         } else {
//             counted_capabilities[c.name] = 1
//         }
//     })
// })
/* log(counted_capabilities) */