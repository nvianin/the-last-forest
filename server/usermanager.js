const log = console.log;
const fs = require("fs");
const crypto = require("crypto");


class UserManager {
    constructor(posts, temperature_data, points) {
        this.users = {};
        this.updatePosts(posts)
        this.points = points
        this.temperature_data = temperature_data;
        this.init();
    };

    init() {
        this.server = require("http").createServer((req, res) => {
            if (req.url == "/") req.url += "index.html";
            req.url = __dirname + "/../client" + req.url;
            log(req.url)
            fs.readFile(req.url, (err, data) => {
                if (err || !req.url.includes("client")) {
                    res.writeHead(404);
                    res.end(JSON.stringify(err));
                    console.error("[404]: " + req.url + " not found!")
                    return
                }
                res.writeHead(200);
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