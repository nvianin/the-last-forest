const log = console.log;
const fs = require("fs");
const crypto = require("crypto");


class UserManager {
    constructor(posts, temperature_data) {
        this.users = {};
        this.posts = posts;
        this.temperature_data = temperature_data;
        this.init();
    };

    init() {
        this.server = require("http").createServer((req, res) => {
            if (req.url == "/") req.url += "index.html";
            req.url = __dirname + "/../client" + req.url;
            /* log(req.url) */
            fs.readFile(req.url, (err, data) => {
                if (err || !req.url.includes("client")) {
                    res.writeHead(404);
                    res.end(JSON.stringify(err));
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
            log("-->" + client.user.id);
            client.emit("posts", this.posts);
            client.emit("temperature_data", this.temperature_data);
            client.on("disconnect", () => {
                log("<--" + client.user.id);
                delete this.users[client.user.id];
            });
        });
        this.server.listen(80);


        log("User manager online");
    };

    broadcastPosts(posts) {
        log("BROADCASTING POSTS TO USERS")
        this.io.sockets.emit("posts", posts);
        this.posts = posts;
    };
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