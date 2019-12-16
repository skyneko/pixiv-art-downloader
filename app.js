const pixiv = require("./api");
const fs = require("fs");
const user = JSON.parse(fs.readFileSync("./account/config.json", "utf-8"));

pixiv.getUserWork(1655331, user,1).then(data => {
    let img = data.map(val => "https://www.pixiv.net/en/artworks/" + val.id);
    pixiv.download(img);
    // console.log(img);
});