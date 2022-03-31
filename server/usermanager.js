const log = console.log;
const fs = require("fs");
const crypto = require("crypto")


class UserManager {
    constructor() {
        this.users = {}

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
            log("-->" + client.user.id)
            client.on("disconnect", () => {
                log("<--" + client.user.id)
                delete this.users[client.user.id];
            })
        })
        this.server.listen(80)


        log("User manager online")
    }
}

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