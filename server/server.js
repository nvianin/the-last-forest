const fs = require("fs");
const snoowrap = require("snoowrap");
const crypto = require("crypto")
const log = console.log;
const download = require("download");
const {
    MongoClient
} = require("mongodb");
const {
    UserManager
} = require("./usermanager")




class Server {
    constructor() {
        this.posts = {}

        this.credentials = fs.readFileSync("./credentials", "utf-8");
        this.r = new snoowrap({
            userAgent: "web:the-last-forest:v0.1 (by /u/TheJack77)",
            clientId: "o3H2m8ptoKpkMLONCyeVOQ",
            clientSecret: this.credentials,
            refreshToken: "21094068-J9uGeSOePPqNG2nndgl6ljbIf_hazQ"
        })

        this.settings = {
            getDailyTopInterval: 1, //hours
        }

        this.client = new MongoClient("mongodb://localhost:27017");
        this.client.connect().then(async client => {
            this.db = this.client.db("last-forest");
            this.reddit_db = this.db.collection("reddit");
            for (let p of await this.reddit_db.find().toArray()) {
                this.posts[p.id] = p;
            };
            this.control_db = this.db.collection("control");
            this.getRedditControl();
            this.load_temperature_data();
            this.userman = new UserManager(this.posts, this.temperature_data);
            log(await this.reddit_db.countDocuments())
        });
        this.sub = this.r.getSubreddit("collapse");

        this.now = Date.now();
        setInterval(() => {
            this.update()
        }, 2000);
        log("Server online")
    }

    getRedditControl() {
        this.control_db.findOne({
            "name": "reddit"
        }).then(reddit_control => {
            this.reddit_control = reddit_control
            log("Last reddit get: " + this.reddit_control.last_getDailyTop);
            log("Last temperature get: " + this.reddit_control.last_tempMonth);
        })
    }
    setRedditControl() {
        this.control_db.replaceOne({
            "name": "reddit"
        }, this.reddit_control).then(e => {
            log(e)
        })
    }

    getDailyTop() {
        this.sub.getTop({
            time: "day"
        }).then(data => {
            this.top = data;
            data.forEach(post => {
                log("-----------------")
                log(post.title + ", by " + post.author.name)
                log(post.url)
                log(post.score + " upvotes")
                log(post.id)
                post.uuid = crypto.randomUUID();
                log(post.uuid)
                log(post.media)
                log(post.comments)
                if (post.score > 300) {
                    this.reddit_db.updateOne({
                        uuid: post.uuid
                    }, {
                        $set: {
                            title: post.title,
                            url: post.url,
                            score: post.score,
                            id: post.id,
                            uuid: post.uuid,
                            media: post.media,
                            comments: post.comments
                        }
                    }, {
                        upsert: true
                    })

                    let p = {
                        title: post.title,
                        url: post.url,
                        score: post.score,
                        id: post.id,
                        uuid: post.uuid,
                        media: post.media,
                        comments: post.comments
                    }
                    this.posts[post.id] = p;
                }
            })
            log(data.length);
            this.userman.broadcastPosts(this.posts)
        })
    }
    /**
    Downloads, then loads temperature data.
    */
    getTemperatureData() {
        download("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", "temperature_data")
            .then(e => {
                log("file downloaded ", e);
                handle_temperature_data()
            })
        this.load_temperature_data()

    }

    /** Loads temperature data from cached file. */
    load_temperature_data() {
        const years = {};
        let data = fs.readFileSync("./temperature_data/GLB.Ts+dSST.csv", "utf-8");
        data = data.split("\n");
        for (let line of data) {
            if (line[0] != "#" && parseInt(line[0])) {
                line = line.split(",");
                let i = 0;
                years[line[0]] = line.slice(1, 13);
            }
        }
        this.temperature_data = years;
        log(this.temperature_data);
    }

    update() {
        this.now = Date.now();
        log("**************************************")
        log("              SERVER STATUS")
        log("   Posts in db: " + Object.keys(this.posts).length)
        log("   Connected users: " + Object.keys(this.userman.users).length)
        log("   Time since last reddit update: " + (Math.floor((this.now - this.reddit_control.last_getDailyTop) /
                1000 / 3600 * 1000)) / 1000 +
            " hours out of " + this.settings.getDailyTopInterval);
        log("**************************************")
        if (this.settings.getDailyTopInterval * 1000 * 3600 < this.now - this.reddit_control.last_getDailyTop) {
            log("REDDIT UPDATE")
            this.getDailyTop();
            this.reddit_control.last_getDailyTop = Date.now();
            this.setRedditControl()
        }

        const current_month = new Date().getMonth();
        if (this.reddit_control.last_tempMonth != current_month) {
            log("TEMPERATURE UPDATE");
            this.getTemperatureData()
            this.reddit_control.last_tempMonth = current_month;
            this.setRedditControl();
        }
    }
}

let s = new Server();




/* let sub = r.getSubreddit("collapse"); */