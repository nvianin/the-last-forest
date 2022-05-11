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
            req.url = __dirname + "/../client" + req.url;
            log(ip + ":" + req.url)
            /* log(this.login_db.findOne({
                ip: ip
            })) */
            // Log documents accessed, by who, how many times.
            this.login_db.findOne({
                ip: ip
            }).then(resp => {
                if (!resp) {
                    this.login_db.insertOne({
                        ip: ip,
                        req: req.url,
                        count: 0
                    })
                } else {
                    this.login_db.updateOne({
                        ip: ip
                    }, {
                        $inc: {
                            "count": 1
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
        this.io = require("socket.io")(this.server);
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
        for (let [key, post] of Object.entries(posts)) {
            this.serialized_posts[key] = {
                title: post.title,
                permalink: post.permalink,
                date: post.date,
                score: post.score,
                tsne_coordinates: post.tsne_coordinates,
                flair: post.flair,
                url: post.url
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