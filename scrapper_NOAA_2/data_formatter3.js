const fs = require("fs");
const log = console.log;

let data = JSON.parse(fs.readFileSync("./stations_measurements.json"))
for (let [key, value] of Object.entries(data)) {
    let years = {};
    for (let [k, v] of Object.entries(value.measurements)) {
        let date = k.split("-");
        let year = date[0];
        let month = date[1];
        let day = date[2];
        /* log(day + "/" + month + "/" + year, JSON.stringify(v)); */
        if (!years[year]) {
            years[year] = {}
        }
        if (!years[year][month]) {
            years[year][month] = {}
        }
        years[year][month][day] = v;
    }
    log(Object.keys(value.measurements).length)
    data[key].measurements = years
}

fs.writeFileSync("./stations_measurements_formatted.json", JSON.stringify(data))