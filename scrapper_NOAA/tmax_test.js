const fs = require("fs");
const log = console.log;
let text = fs.readFileSync("weather_backup.json", {
    encoding: "utf-8"
});
/* log(text) */
text = JSON.parse(text);
/* log(text) */
let years = {}

text.forEach(year => {
    try {
        /* log(year.results[0] != null) */
        years[year.results[0].date.slice(0, 4)] = year.results
    } catch {}
})
let year_check = []
let stations = {}

Object.keys(years).forEach(year => {
    log(years[year])
    year_check.push(year)
    let year_median = 0;
    years[year].forEach(datapoint => {
        /* log(datapoint.station) */
        if (stations[datapoint.station]) {
            stations[datapoint.station].count++
        } else {
            stations[datapoint.station] = {
                count: 1
            };
        }
        year_median += datapoint.value;
    })
    year_median /= years[year].length;
})
log(stations)
let sorted = true;
for (let i = 0; i < year_check.length - 1; i++) {
    let check = year_check[i] < year_check[i + 1];
    /* log(year_check[i], check) */
    if (!check) {
        sorted = false;
    }
}
log("List is sorted: " + sorted)




/* for (let key of Object.keys(text)) {
    log("--------------------")
    log(key)
    log(text[key])
} */