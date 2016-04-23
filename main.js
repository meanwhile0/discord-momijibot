try {
    var discord = require("discord.js");
}
catch (e) {
    console.log("You need to run npm install and make sure it passes with no errors!");
    process.exit();
}

try {
    var authDetails = require("./auth.json");
}
catch (e) {
    console.log("You need to make an auth.json using the example file on the github!");
    process.exit();
}

var bot = new discord.Client(true);

bot.on("ready", function () {
    console.log("Connected!");
});

bot.on("disconnected", function () {
    console.log("Disconnected!");
});

bot.loginWithToken(authDetails.token, function (err) {
    if (err) {
        throw err;
    }
});
