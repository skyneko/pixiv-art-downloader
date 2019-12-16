const pixiv = require("./api");
const fs = require("fs");
const user = JSON.parse(fs.readFileSync("./account/config.json","utf-8"));


pixiv.getAuthAccessToken({username: user.username, password: user.password},console.log);