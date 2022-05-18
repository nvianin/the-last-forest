const log = console.log;
const fs = require("fs");
const crypto = require("crypto");


class UserManager {
    constructor(posts, temperature_data, points, login_db) {
        this.users = {};
        this.updatePosts(posts)
        this.points = points
        this.temperature_data = temperature_data;
        this.init();

        this.login_db = login_db;

        this.mimeTypes = {
            "html": "text/html",
            "jpeg": "image/jpeg",
            "jpg": "image/jpeg",
            "png": "image/png",
            "svg": "image/svg+xml",
            "json": "application/json",
            "js": "text/javascript",
            "css": "text/css"
        };
    };

    init() {
        this.server = require("http").createServer((req, res) => {
            if (req.url == "/") req.url += "index.html";
            const ip = req.socket.address().address;
            const url = req.url;
            req.url = __dirname + "/../client" + req.url;
            log(ip + ":" + req.url)
            /* log(this.login_db.findOne({
                ip: ip
            })) */
            // Log which documents are accessed by who and how many times.
            this.login_db.findOne({
                url: url
            }).then(resp => {
                if (!resp) {
                    const ips = {}
                    ips[ip] = 1
                    this.login_db.insertOne({
                        url: url,
                        ips: ips
                    })
                } else {
                    let ips = resp.ips
                    ips[ip] ? ips[ip]++ : ips[ip] = 1;
                    this.login_db.updateOne({
                        url: url
                    }, {
                        $set: {
                            ips: ips
                        }
                    })
                }
            })
            fs.readFile(req.url, (err, data) => {
                if (err || !req.url.includes("client")) {
                    res.writeHead(404);
                    res.end(JSON.stringify(err));
                    console.error("[404]: " + req.url + " not found!")
                    return
                }
                let mimeType = this.mimeTypes[req.url.split('.').pop()];
                if (!mimeType) mimeType = "text/plain";
                res.writeHead(200, {
                    "Content-Type": mimeType
                });
                res.end(data);
            })
        });
        this.io = require("socket.io")(this.server, {
            cors: {
                origin: "http://localhost:5555",
                methods: ["GET", "POST"]
            }
        });
        this.io.on("connection", client => {
            client.user = new User(client);
            this.users[client.user.id] = client;
            log("-->" + client.handshake.address);
            client.emit("posts", this.serialized_posts);
            /* client.emit("temperature_data", this.temperature_data); */
            /* client.emit("points", this.points) */
            client.on("disconnect", () => {
                log("<--" + client.handshake.address);
                delete this.users[client.user.id];
            });
        });
        this.server.listen(80);


        log("User manager online");
    };

    broadcastPosts(posts) {
        return false;
        log("BROADCASTING POSTS TO USERS")
        this.io.sockets.emit("posts", posts);
        this.posts = posts;
    };

    updatePosts(posts) {
        this.posts = posts
        this.serialized_posts = {}
        let post_array = Object.entries(posts);
        post_array.sort((a, b) => {
            a.date - b.date
        });
        for (let [key, post] of post_array) {
            this.serialized_posts[key] = {
                title: post.title,
                permalink: post.permalink,
                date: post.date,
                score: post.score,
                tsne_coordinates: post.tsne_coordinates,
                flair: post.flair,
                url: post.url,
                has_media: post.has_media,
                media: post.media,
                selftext: post.self_text,
                is_video: post.is_video
            }
        }
    }
};

class User {
    constructor(socket) {
        this.socket = socket;
        this.id = crypto.randomUUID();



        this.kill = false;
    }
}

module.exports = {
    UserManager
}