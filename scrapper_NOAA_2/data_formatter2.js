const fs = require("fs");
const csv = require("csv-parser")
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

let stations = {}

let files = fs.readdirSync("./stations")
for (let file of files) {
    let measurements = {}
    station_files.push(
        fs.createReadStream("./stations/" + file)
        .pipe(csv())
        .on("data", row => {
            log(row)
        })
    );
    break
}