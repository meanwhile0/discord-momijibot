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

var defaultConfig = {
    roleBans: false,
    testConfig: false
}

var fs = require("fs");

var commands = {
    "ping": {
        description: "Responds pong. Used for checking if the bot is alive.",
        usage: "<optional-suffix>",
        hidden: false,
        process: function (bot, msg, suffix) {
            if (!suffix) {
                bot.reply(msg, "pong!");
            }
            else {
                bot.reply(msg, "pong! Your suffix was " + suffix);
            }
        }
    },
    "config": {
        description: "Used for managing server configs. Use `config help` for more information.",
        usage: "<cmd>",
        hidden: false,
        process: function (bot, msg, suffix, suffix2, suffix3) {
            if (msg.channel.permissionsOf(msg.author).hasPermission("manageServer")) {
                var srv = msg.channel.server.id;
                
            }
            else {
                bot.reply(msg, "you don't have `manageServer` permissions!");
            }
        }
    }
};

var bot = new discord.Client();

bot.on("ready", function () {
    console.log("Connected!");
    bot.setPlayingGame("Mountain of Faith");
});

bot.on("disconnected", function () {
    console.log("Disconnected!");
    process.exit();
});

bot.on("message", function (msg) {
    if (msg.author != bot.user && msg.isMentioned(bot.user) && msg.content.split(bot.user)[1] != "") {
        var cmdTxt = msg.content.split(bot.user)[1];
        var cmd = commands[cmdTxt.split(" ")[1]];
        var suffix = cmdTxt.split(" ")[2];
        var suffix2 = cmdTxt.split(" ")[3];
        var suffix3 = cmdTxt.split(" ")[4];

        if (cmdTxt === " help") {
            bot.sendMessage(msg.author, "Here is a list of commands:", function () {
                var msgArray = [];

                msgArray.push("To use these commands, mention me before calling the command! Example: `@MomijiBot help`")
                for (var cmd in commands) {
                    var info = cmd;
                    var usage = commands[cmd].usage;
                    var description = commands[cmd].description;
                    var hidden = commands[cmd].hidden;

                    if (usage) {
                        info += " " + usage;
                    }

                    if (description) {
                        info += "\n\t" + description;
                    }

                    if (!hidden) {
                        msgArray.push(info);
                    }
                }

                bot.sendMessage(msg.author, msgArray);
            });

            bot.reply(msg, "I've sent you a DM with a list of commands.");
        }
        else if (cmd) {
            try {
                cmd.process(bot, msg, suffix, suffix2, suffix3);
            }
            catch (e) {
                
            }
        }

        // bot.reply(msg, "command " + cmd + " and suffix " + suffix + " has been interpreted!");
    }
});

bot.loginWithToken(authDetails.token, function (err) {
    if (err) {
        throw err;
    }
});
