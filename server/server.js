const fs = require("fs");
const snoowrap = require("snoowrap");
const log = console.log;
const {
    MongoClient
} = require("mongodb");
const {
    UserManager
} = require("./usermanager")




class Server {
    constructor() {
        this.posts = {}
        this.userman = new UserManager();

        this.credentials = fs.readFileSync("./credentials", "utf-8");
        this.r = new snoowrap({
            userAgent: "web:the-last-forest:v0.1 (by /u/TheJack77)",
            clientId: "o3H2m8ptoKpkMLONCyeVOQ",
            clientSecret: this.credentials,
            refreshToken: "21094068-J9uGeSOePPqNG2nndgl6ljbIf_hazQ"
        })

        this.settings = {
            getDailyTopInterval: 6 //hours,

        }


        this.client = new MongoClient("mongodb://localhost:27017");
        this.client.connect().then(async client => {
            this.db = this.client.db("last-forest");
            this.reddit_db = this.db.collection("reddit");
            this.control_db = this.db.collection("control");
            this.getRedditControl();
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
                if (post.score > 300) {
                    let p = {
                        title: post.title,
                        url: post.url,
                        score: post.score,
                        id: post.id,
                        media: post.media,
                        comments: post.comments
                    }
                    log("-----------------")
                    log(post.title + ", by " + post.author.name)
                    log(post.url)
                    log(post.score + " upvotes")
                    log(post.id)
                    log(post.media)
                    log(post.comments)
                    this.reddit_db.insertOne(p, {
                        upsert: true
                    })
                    this.posts[post.id] = p;
                }
            })
            log(data.length);
        })
    }

    update() {
        this.now = Date.now();
        log("**************************************")
        log("              SERVER STATUS")
        log("   Posts in db:" + Object.keys(this.posts).length)
        log("   Connected users: " + Object.keys(this.userman.users).length)
        log("   Time since last reddit update: " + ((this.now - this.reddit_control.last_getDailyTop) / 1000 / 3600))
        log("**************************************")
        if (this.settings.getDailyTopInterval * 1000 * 3600 < this.now - this.reddit_control.last_getDailyTop) {
            log("REDDIT UPDATE")
            this.getDailyTop();
            this.reddit_control.last_getDailyTop = Date.now();
            this.setRedditControl()
        }
    }
}

let s = new Server();




/* let sub = r.getSubreddit("collapse"); */