const fs = require("fs");
const https = require("https");
const snoowrap = require("snoowrap");
const log = console.log;

let credentials = fs.readFileSync("./credentials", "utf-8");
log(credentials)
const r = new snoowrap({
    userAgent: "web:the-last-forest:v0.1 (by /u/TheJack77)",
    clientId: "o3H2m8ptoKpkMLONCyeVOQ",
    clientSecret: credentials,
    refreshToken: "21094068-J9uGeSOePPqNG2nndgl6ljbIf_hazQ"
});

let GSOY;
let dataset;
let year = 1900;
let years = [];
let currentYear = new Date().getYear() + 1900;
log("Starting year: " + year + ", current year: " + currentYear)

let baseUrl = "https://www.ncdc.noaa.gov/cdo-web/api/v2/"

getYear(2022);

function getYear() {
    let address = baseUrl + "data?datasetid=GSOY" + "&startdate=" + year + "-01-01" + "&enddate=" + year + "-01-01" + "&datatypeid=TMAX" + "&stationid=GHCND:ITE00100554";
    year++;
    log(address)
    https.get(address, {
            headers: {
                token: credentials
            }
        },
        res => {
            log(res.statusCode);
            log(res.statusMessage);
            res.on("data", data => {
                try {
                    log(data.toString());
                    data = JSON.parse(data);

                    years.push(data);
                } catch (e) {
                    console.error(e);
                }
                if (year < 2022) {
                    log(year)
                    setTimeout(year => {
                        log(year)
                        getYear()
                    }, 500);

                } else {
                    log("Finished ! ")
                    fs.writeFileSync("./weather.json", JSON.stringify(years));
                }
            })
            res.on("error", e => {
                console.error(e);
            })
        }
    )
}

// https.get(baseUrl + "/datasets/GSOY", {
//         headers: {
//             token: credentials
//         }
//     },
//     res => {
//         log(res.statusCode);
//         log(res.statusMessage);
//         res.on("data", data => {
//             log(data)
//             GSOY = JSON.parse(data);
//             log(GSOY)

//             let dataset = baseUrl + "data?datasetid=GSOY" + "&startdate=" + year + "-01-01" + "&enddate=" + year + "-01-01" + "&datatypeid=TMAX";
//             year++;
//             log(dataset)

//             https.get(dataset, {
//                     headers: {
//                         token: credentials
//                     }
//                 },
//                 res => {
//                     log(res.statusCode);
//                     log(res.statusMessage);
//                     res.on("data", data => {
//                         dataset = JSON.parse(data);
//                         log(dataset);
//                     })
//                     res.on("error", e => {
//                         console.error(e);
//                     })
//                 }
//             )

//         })
//         res.on("error", e => {
//             console.error(e)
//         })
//     }
// )

let sub = r.getSubreddit("collapse")
log(sub);
if (false) {
    sub.getTop({
        time: "day"
    }).then(data => {
        top = data;
        data.forEach(post => {
            log("-----------------")
            log(post.title + ", by " + post.author.name)
            log(post.url)
            log(post.score + " upvotes")
            log(post.media)
        })
    })
}