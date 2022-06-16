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
/* const language = require("@google-cloud/language"); */
const PoissonDiskSampling = require("poisson-disk-sampling");
const {
    spawn
} = require("child_process")
const Utils = require("../client/resources/classes/Utils.js")
/* const simpleGit = require("simple-git"); */
/* simpleGit().clean(simpleGit.CleanOptions.FORCE); */

const mediaConditions = ["v.redd.it", ".jpg", ".jpeg", ".webm", ".webp", ".png", "i.redd.it", "imgur"]


class Server {
    constructor() {
        const poisson = new PoissonDiskSampling({
            shape: [384, 384],
            minDistance: 5,
            maxDistance: 10,
            tries: 3
        })

        this.points = poisson.fill();
        this.posts = {}
        /* this.language_client = new language.LanguageServiceClient(); */

        this.credentials = fs.readFileSync("./credentials", "utf-8");
        /* try {
            this.git_credentials = fs.readFileSync("./git_credentials", "utf-8");
            this.remote = "https://nvianin:" + this.git_credentials + "@github.com/nvianin/the-last-forest";
        } catch (e) {
            log("Git credentials could not be read, skipping")
        } */
        this.r = new snoowrap({
            userAgent: "web:the-last-forest:v0.1 (by /u/TheJack77)",
            clientId: "o3H2m8ptoKpkMLONCyeVOQ",
            clientSecret: this.credentials,
            refreshToken: "21094068-J9uGeSOePPqNG2nndgl6ljbIf_hazQ"
        })

        this.settings = {
            getDailyTopInterval: 1, //hours
            recentCommentThreshold: 12 //hours
        }

        this.client = new MongoClient("mongodb://localhost:27017");
        this.client.connect().then(async client => {
            this.db = this.client.db("last-forest");
            this.reddit_db = this.db.collection("reddit");
            for (let p of await this.reddit_db.find().toArray()) {
                this.posts[p.permalink] = p;
            };
            this.control_db = this.db.collection("control");

            this.getRedditControl();
            this.load_temperature_data();

            this.login_db = await this.db.collection("login")

            this.userman = new UserManager(this.posts, this.temperature_data, this.points, this.login_db);
            /* this.userman.io.addEvent */
            log(await this.reddit_db.countDocuments())
        });
        this.sub = this.r.getSubreddit("collapse");

        this.now = Date.now();
        setInterval(() => {
            this.update()
        }, 2000);
        log("Server online")
        /* setTimeout(this.save_data_to_json.bind(this), 3000) */
    }

    save_data_to_json() {
        fs.writeFileSync("./sample_posts.json", JSON.stringify(this.posts))
        fs.writeFileSync("./sample_points.json", JSON.stringify(this.points))
        log("EXPORTED DB DATA TO JSON")
    }

    /** Fetches the control document. */
    getRedditControl() {
        this.control_db.findOne({
            "name": "reddit"
        }).then(reddit_control => {
            this.reddit_control = reddit_control
            log("Last reddit get: " + new Date(this.reddit_control.last_getDailyTop));
            log("Last temperature get: " + this.reddit_control.last_tempMonth);
        })

        this.control_db.findOne({
            "name": "gapi"
        }).then(gapi_control => {
            this.gapi_control = gapi_control;
            log("Last gapi reset: " + new Date(this.gapi_control.last_reset));
        })
    }
    /** Updates the control document. */
    setRedditControl() {
        this.control_db.replaceOne({
            "name": "reddit"
        }, this.reddit_control).then(e => {
            log(e)
        })

        this.control_db.replaceOne({
            "name": "gapi"
        }, this.gapi_control).then(e => {
            log(e)
        })
    }

    /** Gets and stores the daily top posts from r/collapse. */
    async getDailyTop() {
        this.top = await this.sub.getTop({
            time: "day"
        })
        for (let post of this.top) {
            /* data.forEach(post => { */
            log("-----------------")
            log(post.title + ", by " + post.author.name)
            log(post.permalink)
            log(post.url)
            log(post.score + " upvotes")
            log(post.id)
            log(post.created_utc)
            post.uuid = crypto.randomUUID();
            log(post.uuid)
            log(post.media)
            log(post)
            const hasMedia = mediaConditions.some(i => {
                return post.url.includes(i);
            })
            let p = {
                title: post.title,
                url: post.url,
                permalink: post.permalink,
                score: post.score,
                id: post.id,
                date: post.created_utc,
                uuid: post.uuid,
                has_media: hasMedia,
                media: post.media,
                comments: post.comments,
                self_text: post.selftext,
                is_video: post.is_video,
            }

            /* log(post.comments) */
            if (post.score > 300) {
                if (await this.reddit_db.findOne({
                        date: post.created_utc
                    }) ? true : false) {
                    this.reddit_db.updateOne({
                        date: post.created_utc
                    }, {
                        $set: {
                            score: post.score
                        }
                    })
                } else {


                    // Sentiment analysis  ¨!!!!!!!!!!!!!!!!!! SKIPPED !!!!!!!!!!!!!!!!!!!
                    let post_sentiment_exists = true;
                    let existing_post = await this.reddit_db.findOne({
                            url: post.url
                        })
                        .then(res => {
                            if (res.title) {
                                post_sentiment_exists = true;
                            }
                        }).catch(err => {
                            /* log(err.message) */
                        })
                    log(post_sentiment_exists ? "Sentiment analysis exists, skipping..." : "Analysis post sentiment");
                    let requests_this_month = (await this.control_db.findOne({
                        "name": "gapi"
                    })).requests_this_month
                    log(requests_this_month)
                    if (requests_this_month >= 4900) log("skipping due to token limit")
                    if (!post_sentiment_exists && requests_this_month < 4900) {
                        /* return false; */
                        let sentiment = await this.language_client.analyzeSentiment({
                            document: {
                                content: post.title,
                                type: "PLAIN_TEXT"
                            }
                        })
                        this.control_db.updateOne({
                            name: "gapi"
                        }, {
                            $inc: {
                                requests_this_month: 1
                            }
                        })
                        log(sentiment[0].documentSentiment)
                        this.reddit_db.updateOne({
                            permalink: post.permalink
                        }, {
                            $set: {
                                sentiment: sentiment[0].documentSentiment
                            }
                        }, {
                            upsert: true
                        })
                    }
                    this.reddit_db.updateOne({
                        permalink: post.permalink
                    }, {
                        $set: {
                            title: post.title,
                            url: post.url,
                            permalink: post.permalink,
                            score: post.score,
                            id: post.id,
                            date: post.created_utc,
                            uuid: post.uuid,
                            has_media: hasMedia,
                            media: post.media
                        }
                    }, {
                        upsert: true
                    })


                }
                this.posts[post.permalink] = p;
            }
        } /* ) */
        log(this.top.length);
        /* log(Object.values(this.posts)[0]) */
        this.getCommentsFromRecentPosts();
        /* this.userman.broadcastPosts(this.posts); */
        this.userman.updatePosts(this.posts);
    }

    getCommentsFromRecentPosts() {
        log("FETCHING RECENT COMMENTS")
        for (let [key, post] of Object.entries(this.posts)) {
            /* log(key) */
            /* log(post) */
            if (post.date * 1000 < Date.now() - 1000 * 60 * 60 * this.settings.recentCommentThreshold && post.comments && post.comments.fetchAll) {
                /* log(post.comments) */
                post.comments.fetchAll().then(comments => {
                    let post_comments = []
                    for (let com of comments) {
                        com.replies.fetchAll().then(replies => {
                            /* log(replies) */
                            let comment_replies = [];
                            replies.forEach(r => {
                                comment_replies.push(this.parseComment(r))
                            })
                            let c = {
                                user: com.author.name,
                                body: com.body,
                                score: com.ups - com.downs,
                                date: com.created_utc,
                                replies: comment_replies,
                            }
                            post_comments.push(c)
                            this.posts[key].comments = post_comments
                            /* log(post_comments) */
                            this.reddit_db.updateOne({
                                permalink: this.posts[key].permalink
                            }, {
                                "$set": {
                                    comments: post_comments
                                }
                            })
                            /* log("replies:", comment_replies);
                            log(c) */
                        })
                    }
                })
            }
        }
    }

    parseComment(comment) {
        let c = {
            user: comment.author.name,
            body: comment.body,
            score: comment.ups - comment.downs,
            date: comment.created_utc,
            /* replies: comment.replies, */
        }
        return c;
    }
    /**
    Downloads, then loads temperature data.
    */
    getTemperatureData() {
        download("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", "temperature_data")
            .then(e => {
                log("file downloaded ", e);
                this.load_temperature_data();
            })
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

    async update() {
        if (!this.gapi_control || !this.reddit_control) return
        this.now = Date.now();
        const last_gapi_reset = (Date.now() - this.gapi_control.last_reset) / 1000 / 60 / 60 / 24;
        log("**************************************")
        log("              SERVER STATUS")
        log("   Posts in db: " + Object.keys(this.posts).length)
        log("   Connected users: " + Object.keys(this.userman.users).length)
        log("   Time since last reddit update: " + (Math.floor((this.now - this.reddit_control.last_getDailyTop) /
                1000 / 3600 * 1000)) / 1000 +
            " hours out of " + this.settings.getDailyTopInterval);
        log("   Last gapi reset: " + last_gapi_reset + " out of 31 days")
        log(this.displayClientsIp())
        log("**************************************")

        if (this.settings.getDailyTopInterval * 1000 * 3600 < this.now - this.reddit_control.last_getDailyTop) {
            log("REDDIT UPDATE")
            this.getDailyTop();
            this.reddit_control.last_getDailyTop = Date.now();
            this.setRedditControl()

            /* await Utils.wait(6000);
            log("Building TSNE !")
            this.buildTSNE() */
            await Utils.wait(15000);
            this.reloadPostsDB();
        }

        const current_month = new Date().getMonth();
        if (this.reddit_control.last_tempMonth != current_month) {
            log("TEMPERATURE UPDATE");
            this.getTemperatureData()
            this.reddit_control.last_tempMonth = current_month;
            this.setRedditControl();
        }

        if (last_gapi_reset > 31) {
            this.gapi_control.last_reset = Date.now();
            this.gapi_control.requests_this_month = 0;
            this.setRedditControl()
        }

    }

    displayClientsIp() {
        let current_users = ""
        this.userman.io.sockets.sockets.forEach(socket => {
            log(socket.handshake.address)
        })
        return
    }

    async reloadPostsDB() {
        log("Reloading the post DB...")
        this.posts = await this.reddit_db.find({}).toArray()
        this.userman.updatePosts(this.posts);
        log("Post DB reloaded.")
    }

    buildTSNE() {
        if (this.python) {
            this.python.kill()
        }
        this.python = spawn("python", ["./bert/build_tsne.py"])
        this.python.stdout.on("data", data => {
            log("[PYTHON]" + data.toString())
        })
        this.python.stderr.on("data", error => {
            console.error(error.toString())
        })
    }
}

let s = new Server();




/* let sub = r.getSubreddit("collapse"); */