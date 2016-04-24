try {
    var discord = require("discord.js");
    var mysql = require("mysql");
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

var fs = require("fs");

var sqlDataTypes = {
    1: "tinyint",
    2: "smallint",
    3: "int",
    4: "float",
    5: "double",
    7: "timestamp",
    8: "bigint",
    9: "mediumint",
    10: "date",
    11: "time",
    12: "datetime",
    13: "year",
    16: "bit",
    253: "varchar",
    254: "char",
    246: "decimal"
};

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
                var srvTable = "srv_" + srv;
                
                if (suffix === "view") {
                    connection.query("SELECT * FROM " + srvTable, function (err, results, fields) {
                        if (err) {
                            throw err;
                        }

                        var msgArray = [];
                        msgArray.push("Here's the config for this server:");
                        msgArray.push("```");

                        for (var field in fields) {
                            if (fields[field].name !== "serverID") {
                                var result = results[0][fields[field].name];
                                var type = sqlDataTypes[fields[field].type];

                                if (type === "tinyint") {
                                    if (result === 1) {
                                        msgArray.push(fields[field].name + ": true");
                                    }
                                    else {
                                        msgArray.push(fields[field].name + ": false");
                                    }
                                }
                                else {
                                    msgArray.push(fields[field].name + ": " + result);
                                }
                            }
                        }

                        msgArray.push("```");
                        bot.sendMessage(msg.channel, msgArray);
                    });
                }
                else if (suffix === "set") {
                    if (!suffix2) {
                        bot.reply(msg, "you need to specify an option to change!");
                        return;
                    }

                    connection.query("SELECT * FROM " + srvTable, function (err, results, fields) {
                        if (err) {
                            throw err;
                        }

                        var configOptions = [];

                        for (field in fields) {
                            if (fields[field].name !== "serverID") {
                                configOptions[fields[field].name] = results[0][fields[field].name];
                            }
                        }
                        
                        console.log(configOptions);
                        console.log(configOptions[suffix2]);

                        if (configOptions[suffix2] !== undefined) {
                            var value;

                            console.log(suffix2 + " is in configOptions!");

                            if (!suffix3) {
                                bot.reply(msg, "you need to set a value!");
                                return;
                            }
                            else if (suffix3.toLowerCase() === "true" || suffix3.toLowerCase() === "false") {
                                value = suffix3.toLowerCase();
                            }
                            else {
                                value = connection.escape(suffix3.toLowerCase());
                            }
                            
                            connection.query("UPDATE " + srvTable + " SET " + suffix2 + " = " + value + ";", function (err, results, fields) {
                                if (err) {
                                    console.log(err);
                                    bot.sendMessage(msg.channel, "***ERROR:*** *`" + err.code + "`!\nPlease ensure your input is valid, or contact `@meanwhile#8540` for assistance!*");
                                    return;
                                }

                                bot.sendMessage(msg.channel, "I have set `" + suffix2 + "` to `" + value + "`!");
                            });
                        }
                        else {
                            console.log(suffix2 + " is not in configOptions or is undefined!");
                        }
                    });
                }
                else if (suffix2 === "update") {

                }
            }
            else {
                bot.reply(msg, "you don't have `manageServer` permissions!");
            }
        }
    }
};

var bot = new discord.Client();
var connection = mysql.createConnection({
    host: authDetails.host,
    user: authDetails.user,
    password: authDetails.password,
    database: authDetails.database
});

bot.on("ready", function () {
    console.log("Connected!");
    bot.setPlayingGame("Mountain of Faith");
    connection.connect();
});

bot.on("disconnected", function () {
    console.log("Disconnected!");
    connection.end();
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

bot.on("serverCreated", function(srv) {
    var srvTable = "srv_" + srv.id;
    var escSrvTable = connection.escape(srvTable);
    var escSrvID = connection.escape(srv.id);

    connection.query("CREATE TABLE IF NOT EXISTS " + srvTable + " ( serverID VARCHAR(18), roleBans BOOL, configTest BOOL, newOption DATETIME );", function(err, result) {
        if (err) {
            throw err;
        }
    });

    connection.query("SELECT EXISTS ( SELECT 1 FROM " + srvTable + " WHERE serverID = " + escSrvID + " );", function (err, results, fields) {
        if (err) {
            throw err;
        }

        var result = results[0][fields[0].name];
        
        if (result === 0) {
            connection.query("INSERT INTO " + srvTable + " VALUES ( '" + srv.id + "', false, false, now() );", function (err, result) {
                if (err) {
                    throw err;
                }
            });
            console.log("Row doesn't exist, creating it!");
        }
        else {
            console.log("Row exists, not creating it!");
        }
    });
});

bot.loginWithToken(authDetails.token, function (err) {
    if (err) {
        throw err;
    }
});
