const THREE = require("three")
const {
    TreeManager
} = require("./Tree_server.js")
const {
    Ruleset,
    Turtle
} = require("./Turtle_server.js")

class treeBuilder {
    constructor(posts_db) {
        this.posts_db = posts_db;

        this.tree = new TreeManager()
    }
}

const tree = new treeBuilder("fuck")