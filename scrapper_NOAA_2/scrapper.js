const fs = require("fs");
const https = require("https");
const log = console.log;

/* const baseUrl = "https://www.ncdc.noaa.gov/cdo-web/api/v2/"
let adress = baseUrl + "data?datasetid=GSOY" + "&startdate=1763-01-01" + "&enddate=2022-12-31" + "&datatypeid="
https.get() */


let stations = fs.readFileSync("./stations.txt", "utf-8").split("\n");
/* stations[0] = stations[0].replace(/\s+/g, ',')
log(stations[0]); */

let dataPoints = []

let test = stations[0].split("")
test.forEach(char => {
    if (char != " ") {
        log(char)
    }
})

log(test)

class dataPoint {
    constructor(id, latitude, longitude, elevation, name) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.elevation = elevation;
        this.name = name;
    }
}