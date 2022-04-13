const fs = require("fs");
const log = console.log;

let data = fs.readFileSync("./stations_measurements_formatted.json", "utf-8")
data = JSON.parse(data);

let stations = {}

for (let station of Object.values(data)) {
    for (let [year, yearly_data] of Object.entries(station.measurements)) {
        /* log(year, measurement) */
        for (let [month, monthly_data] of Object.entries(yearly_data)) {
            let median = 0
            for (let daily_data of Object.values(monthly_data)) {
                median += daily_data.tavg
            }
            median /= Object.keys(monthly_data).length;
            /* station.measurements[year][month].median = median; */
            station.measurements[year][month] = median;
            /* log(month + "/" + year, median) */
        }
    }
    stations[station.id] = station
}

fs.writeFileSync("./stations_medians.json", JSON.stringify(stations));