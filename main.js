try {
    var discord = require("discord.js");
    var mkdirp = require("mkdirp");
    var asyncParse = require("json-parse-async");
    var asyncJSON = require("async-json");
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
    "roleBans": false,
    "testConfig": false
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
        process: function (bot, msg, suffix) {
            if (msg.channel.permissionsOf(msg.author).hasPermission("manageServer")) {
                var srv = msg.channel.server.id;
                var configDir = "./servers/" + srv + "/config/";
                var configFile = configDir + "config.json";

                if (!suffix) {
                    mkdirp(configDir, function (err) {
                        if (err) {
                            throw err;
                        }
                    
                        fs.stat(configFile, function (err, stat) {
                            if (err === null) {
                                console.log("Config for " + srv + " is present!");
                            }
                            else if (err.code === "ENOENT") {
                                fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 4), function (err) {
                                    if (err) {
                                        throw err;
                                    }

                                    console.log("Created a default config for server " + srv + "!");
                                    bot.reply(msg, "I have created a config for your server!");
                                });
                            }
                            else {
                                throw err;
                            }
                        });

                        // console.log("Created a config for server: " + srv);
                        // bot.reply(msg, "I have created a config for this server!");
                    });
                }

                if (suffix === "help") {
                    bot.sendMessage(msg.author, "Placeholder message about configs");
                    bot.reply(msg, "I have sent you a DM containing information about configs!");
                }

                if (suffix === "view") {
                    fs.readFile(configFile, "utf8", function(err, out) {
                        if (err === null) {

                        }
                        else if (err.code === "ENOENT") {
                            console.log("Config for " + srv + " doesn't exist!");
                            bot.reply(msg, "you need to run `@MomijiBot config` to generate a config first!");
                            return;
                        }
                        else {
                            throw err;
                        }

                        var msgArray = [];

                        msgArray.push("here is the config for this server:");
                        msgArray.push("```" + out + "```");

                        bot.reply(msg, msgArray);
                    });
                }
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
                cmd.process(bot, msg, suffix);
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
