const download = require("download");

download("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", "temperature_data")
    .then(e => {
        log("file downloaded ", e);
    })

/* (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv");
    page.content().then(content => {
        log(content)
        fs.writeFileSync("gistemp.txt", content);
    })


    await page.screenshot({
        path: "test.png"
    });

    await browser.close();
})() */