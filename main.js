try {
    var discord = require("discord.js");
    var mysql = require("mysql");
    var moment = require("moment");
}
catch (e) {
    throw e;
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

try {
    var sqlTables = require("./tables.json");
}
catch (e) {
    console.log("You need to make a tables.json using the example file on the github!");
    process.exit();
}

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
    "pet": {
        description: "Pet an Otter today!",
        usage: "<@user>",
        hidden: false,
        process: function (bot, msg, suffix) {
            if (!msg.channel.server) {
                bot.sendMessage(msg.author, "Sorry, but I cannot perform this command in a DM.");
                return;
            }

            if (msg.mentions.length < 2) {
                bot.reply(msg, "please @mention the user you wish to pet. I also can't pet myself.");
                return;
            }

            msg.mentions.map(function (user) {
                if (user !== bot.user) {
                    bot.sendMessage(msg.channel, "*pets " + user + "*");
                }
            });

        }
    },
    "ratewaifu": {
        description: "Rate that shit waifu of yours or something. Katia and Asuka are rated zero.",
        usage: "<shitwaifu>",
        hidden: false,
        process: function (bot, msg, suffix) {
            if (!suffix) {
                bot.sendMessage(msg.channel, "You need to name a waifu for me to rate.");
                return;
            }

            var rating = Math.floor(Math.random() * (10 - 1)) + 1;
            var waifu = connection.escape(suffix.toLowerCase());

            if (waifu.length > 100) {
                bot.sendMessage(msg.channel, "That waifu's name is too long.");
                return;
            }

            if (suffix.toLowerCase() === "maki" || suffix.toLowerCase() === "nishikino maki" || suffix.toLowerCase() === "maki nishikino") {
                bot.sendMessage(msg.channel, "I rate " + suffix + " a DIO/10.");
                return;
            }

            connection.query("SELECT EXISTS ( SELECT 1 FROM " + sqlTables.waifus + " WHERE waifuName = " + waifu + " );", function (err, results, fields) {
                if (err) {
                    throw err;
                }

                var found = results[0][fields[0].name];

                if (found === 1) {
                    connection.query("SELECT * FROM " + sqlTables.waifus + " WHERE waifuName = " + waifu + ";", function (err, results, fields) {
                        if (err) {
                            throw err;
                        }
                        
                        var result = results[0]["waifuRating"];

                        bot.sendMessage(msg.channel, "I rate " + suffix + " a " + result + "/10.");
                    })
                }
                else if (found === 0) {
                    connection.query("INSERT INTO " + sqlTables.waifus + " VALUES ( " + waifu + ", " + rating + " ) ", function (err, result) {
                        if (err) {
                            throw err;
                        }

                        bot.sendMessage(msg.channel, "I rate " + suffix + " a " + rating + "/10.");
                    });
                }
                else {
                    
                }
            });
        }
    },
    "ban": {
        description: "Ban a cunt",
        usage: "<@user> <reason>",
        hidden: false,
        process: function (bot, msg, suffix) {
            if (!msg.channel.server) {
                bot.sendMessage(msg.author, "Sorry, but I cannot perform this command in a DM.");
                return;
            }

            if (!msg.channel.permissionsOf(msg.author).hasPermission("manageRoles")) {
                bot.reply(msg, "you do not have the `manageRoles` permission.");
                return;
            }

            if (!msg.channel.permissionsOf(bot.user).hasPermission("manageRoles")) {
                bot.reply(msg, "I do not have the `manageRoles` permission.");
                return;
            }

            if (msg.mentions.length < 2) {
                bot.reply(msg, "please mention someone you want to ban. I cannot ban myself.");
                return;
            }

            var memberRole;
            var bannedRole;
            var reason = "NULL";

            for (i = 0; i < msg.channel.server.roles.length; i++) {
                if (msg.channel.server.roles[i].name === "Members") {
                    memberRole = msg.channel.server.roles[i];
                }
                else if (msg.channel.server.roles[i].name === "BANNED") {
                    bannedRole = msg.channel.server.roles[i];
                }
            }

            msg.mentions.map(function (user) {
                if (user !== bot.user) {
                    if (suffix.split(user)[1] !== undefined) {
                        reason = connection.escape(suffix.split(user + " ")[1]);

                        if (reason.length > 200) {
                            bot.reply(msg, "that ban reason is too long. The limit is 200 characters, sometimes smaller, depending on the content.");
                            return;
                        }
                    }

                    if (bot.userHasRole(user, memberRole)) {
                        bot.removeUserFromRole(user, memberRole, function (err) {
                            if (err) {
                                bot.sendMessage(msg.channel, "Woops, error: " + err.code);
                                console.log(err);
                                return;
                            }

                            bot.addUserToRole(user, bannedRole, function (err) {
                                if (err) {
                                    bot.sendMessage(msg.channel, "Woops, error: " + err.code);
                                    console.log(err);
                                    return;
                                }

                                if (reason !== "NULL") {
                                    bot.sendMessage(msg.channel, user + " has been banned by " + msg.author + " for the reason: " + reason + ".");
                                }
                                else {
                                    bot.sendMessage(msg.channel, user + " has been banned by " + msg.author + ".");
                                }

                                connection.query("INSERT INTO " + sqlTables.bans + " VALUES ( '" + user + "', " + reason + " , NOW() );", function (err, results, fields) {
                                    if (err) {
                                        throw err;
                                    }
                                    
                                    connection.query("SELECT * FROM " + sqlTables.bans + " ORDER BY bannedAt DESC LIMIT 1;", function (err, results, fields) {
                                        if (err) {
                                            throw err;
                                        }

                                        var reason = results[0]["reason"];
                                        var bannedAt = results[0]["bannedAt"];
                                        var msgArray = [];

                                        msgArray.push("```");
                                        msgArray.push("User banned: " + user.username);
                                        msgArray.push("Banned by: " + msg.author.username);

                                        if (reason !== null) {
                                            msgArray.push("Reason: " + reason);
                                        }

                                        msgArray.push("Banned at: " + bannedAt);
                                        msgArray.push("```");

                                        for (i = 0; i < msg.channel.server.channels.length; i++) {
                                            if (msg.channel.server.channels[i].topic === "momiji-event-log") {
                                                bot.sendMessage(msg.channel.server.channels[i], msgArray);
                                            }
                                        }
                                    });
                                });
                            });
                        });
                    }
                    else {
                        bot.reply(msg, "that user is not in the `Members` role.");
                    }
                }
            });
        }
    },
    "unban": {
        description: "Unban a cunt",
        usage: "<@user>",
        hidden: false,
        process: function (bot, msg, suffix) {
            if (!msg.channel.server) {
                bot.sendMessage(msg.author, "Sorry, but I cannot perform this command in a DM.");
                return;
            }

            if (!msg.channel.permissionsOf(msg.author).hasPermission("manageRoles")) {
                bot.reply(msg, "you do not have the `manageRoles` permission.");
                return;
            }

            if (!msg.channel.permissionsOf(bot.user).hasPermission("manageRoles")) {
                bot.reply(msg, "I do not have the `manageRoles` permission.");
                return;
            }

            if (msg.mentions.length < 2) {
                bot.reply(msg, "please mention someone you want to unban. I cannot unban myself.");
                return;
            }

            var memberRole;
            var bannedRole;

            for (i = 0; i < msg.channel.server.roles.length; i++) {
                if (msg.channel.server.roles[i].name === "Members") {
                    memberRole = msg.channel.server.roles[i];
                }
                else if (msg.channel.server.roles[i].name === "BANNED") {
                    bannedRole = msg.channel.server.roles[i];
                }
            }

            msg.mentions.map(function (user) {
                if (user !== bot.user) {
                    if (bot.userHasRole(user, bannedRole)) {
                        bot.removeUserFromRole(user, bannedRole, function (err) {
                            if (err) {
                                bot.sendMessage(msg.channel, "Woops, error: " + err.code);
                                console.log(err);
                                return;
                            }

                            bot.addUserToRole(user, memberRole, function (err) {
                                if (err) {
                                    bot.sendMessage(msg.channel, "Woops, error: " + err.code);
                                    console.log(err);
                                    return;
                                }

                                bot.sendMessage(msg.channel, user + " has been unbanned by " + msg.author + ".");
                            });
                        });
                    }
                    else {
                        bot.reply(msg, "that user is not in the `Members` role.");
                    }
                }
            });
        }
    },
    "eval": {
        description: "eval",
        usage: "<eva>",
        hidden: true,
        process: function (bot, msg, suffix) {
            if (msg.sender.id === "104374046254186496") {
                bot.sendMessage(msg.channel, eval(suffix, bot));
            }
            else {
                console.log("yo");
            }
        }
    },
    "whois": {
        description: "Who's that pokemon!?",
        usage: "<@user>",
        hidden: false,
        process: function (bot, msg, suffix) {
            if (!msg.channel.server) {
                bot.sendMessage(msg.author, "Sorry, but I cannot perform this command in a DM.");
                return;
            }

            if (msg.mentions.length < 2) {
                bot.reply(msg, "please mention the user you want information about. You cannot get information about me.");
            }

            msg.mentions.map(function (user) {
                if (user !== bot.user) {
                    var msgArray = [];

                    msgArray.push("User: " + user.username);
                    msgArray.push("ID: " + user.id);
                    msgArray.push("Status: " + user.status);
                
                    if (user.avatarURL !== null) {
                        msgArray.push("Avatar: " + user.avatarURL);
                    }

                    bot.sendMessage(msg.channel, msgArray);
                }
            });
        }
    },
    /*"baninfo": {
        description: "Fetch the ban information of a user",
        usage: "<@user>",
        hidden: false,
        process: function (bot, msg, suffix) {
            if (!msg.channel.server) {
                bot.sendMessage(msg.author, "Sorry, but I cannot perform this command in a DM.");
                return;
            }

            if (msg.mentions.length < 2) {
                bot.reply(msg, "please mention the user you want ban information about. You cannot get ban information about me.");
                return;
            }

            msg.mentions.map(function (user) {
                if (user !== bot.user) {
                    connection.query("SELECT EXISTS ( SELECT 1 FROM " + sqlTables.bans + " WHERE id = '" + user + "' );", function (err, results, fields) {
                        if (err) {
                            throw err;
                        }
                        
                        var found = results[0][fields[0].name];
                        
                        if (found === 1) {
                            connection.query("SELECT * FROM " + sqlTables.bans + " WHERE id = '" + user + "';", function (err, results, fields) {
                                if (err) {
                                    throw err;
                                }

                                var msgArray = [];

                                bot.sendMessage(msg.author, "Ban information for user " + user.username + ":");
                                
                                for (i = 0; i < results.length; i++) {
                                    var time = results[i]["bannedAt"];
                                    var reason = results[i]["reason"];
                                    var bannedUntil = results[i]["bannedUntil"];

                                    msgArray.push("```");
                                    msgArray.push("Banned at: " + time);

                                    if (bannedUntil !== null) {
                                        msgArray.push("Banned until: " + bannedUntil);
                                    }

                                    if (reason !== null) {
                                        msgArray.push("Reason: " + reason);
                                    }

                                    msgArray.push("```");

                                    bot.sendMessage(msg.author, msgArray);
                                }

                                bot.reply(msg, "I have sent " + user + "'s ban information to you.");
                            });
                        }
                        else if (found === 0) {
                            bot.reply(msg, "there is no ban information for " + user + ".");
                        }
                    });
                }
            });
        }
    },*/
    "tban": {
        description: "Temp ban a cunt. Uses ISO 8601 durations for ban length. Ask meanwhile for more info",
        usage: "<@user> <\"ban length\"> <\"reason\">",
        hidden: false,
        process: function (bot, msg, suffix) {
            if (!msg.channel.server) {
                bot.sendMessage(msg.author, "Sorry, but I cannot perform this command in a DM.");
                return;
            }

            if (!msg.channel.permissionsOf(msg.author).hasPermission("manageRoles")) {
                bot.reply(msg, "you do not have the `manageRoles` permission.");
                return;
            }

            if (!msg.channel.permissionsOf(bot.user).hasPermission("manageRoles")) {
                bot.reply(msg, "I do not have the `manageRoles` permission.");
                return;
            }

            if (msg.mentions.length < 2) {
                bot.reply(msg, "please mention the user you want to temp ban. I cannot temp ban myself.");
                return;
            }

            var cmdSuffix;
            var banLength;
            var banReason = "NULL";
            var addedTime;
            var bannedUntil;
            var iso8601Regex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;
            var memberRole;
            var bannedRole;
            var userNum = 0;

            for (i = 0; i < msg.channel.server.roles.length; i++) {
                if (msg.channel.server.roles[i].name === "Members") {
                    memberRole = msg.channel.server.roles[i];
                }
                else if (msg.channel.server.roles[i].name === "BANNED") {
                    bannedRole = msg.channel.server.roles[i];
                }
            }

            msg.mentions.map(function (user) {
                if (user !== bot.user) {
                    userNum++;
                    if (suffix.split(user)[1] !== undefined) {
                        cmdSuffix = suffix.split(user + " ")[1].match(/(".*?"|[^"\s]+(<?!.*?>)+)(?=\s*|\s*S)/g);
                        banLength = cmdSuffix[0].replace(/\"/g, "").toUpperCase();
                        addedTime = moment().add(moment.duration(banLength));
                        console.log(moment(addedTime).format("YYYY-MM-DDTHH:mm:ss"));
                        bannedUntil = moment(addedTime).format("ddd MMMM DD YYYY HH:mm:ss [GMT]ZZ [(BST)]");
                        
                        if (cmdSuffix[1] !== undefined) {
                            banReason = connection.escape(cmdSuffix[1].replace(/\"/g, ""));
                        }
                        
                        if (!iso8601Regex.test(banLength)) {
                            bot.reply(msg, "the ban length needs to use the ISO 8601 duration format. Ask meanwhile for more information.");
                            msg.mentions.length = 0;
                            return;
                        }
                    }
                    else {
                        bot.reply("you need to specify a ban length and/or a ban reason.");
                        return;
                    }

                    if (bot.userHasRole(user, memberRole)) {
                        bot.removeUserFromRole(user, memberRole, function (err) {
                            if (err) {
                                bot.sendMessage(msg.channel, "Woops, error: " + err.code);
                                console.log(err);
                                return;
                            }

                            bot.addUserToRole(user, bannedRole, function (err) {
                                if (err) {
                                    bot.sendMessage(msg.channel, "Woops, error: " + err.code);
                                    console.log(err);
                                    return;
                                }

                                if (banReason !== "NULL") {
                                    bot.sendMessage(msg.channel, user + " has been banned until " + bannedUntil + " by " + msg.author + " for the reason: " + banReason + ".");
                                }
                                else {
                                    bot.sendMessage(msg.channel, user + " has been banned until " + bannedUntil + " by " + msg.author + ".");
                                }

                                connection.query("INSERT INTO " + sqlTables.bans + " VALUES ( '" + user + "', " + banReason + ", NOW(), '" + moment(addedTime).format("YYYY-MM-DDTHH:mm:ss") + "' );", function (err, results, fields) {
                                    if (err) {
                                        throw err;
                                    }

                                    connection.query("SELECT * FROM " + sqlTables.bans + " ORDER BY bannedAt DESC LIMIT 1;", function (err, results, fields) {
                                        if (err) {
                                            throw err;
                                        }

                                        var reason = results[0]["reason"];
                                        var bannedAt = results[0]["bannedAt"];
                                        var bannedUntil = results[0]["bannedUntil"];
                                        var msgArray = [];

                                        msgArray.push("```");
                                        msgArray.push("User banned: " + user.username);
                                        msgArray.push("Banned by: " + msg.author.username);
                                        
                                        if (reason !== null) {
                                            msgArray.push("Reason: " + reason);
                                        }

                                        msgArray.push("Banned at: " + bannedAt);
                                        msgArray.push("Banned until: " + bannedUntil);
                                        msgArray.push("```");

                                        for (i = 0; i < msg.channel.server.channels.length; i++) {
                                            if (msg.channel.server.channels[i].topic === "momiji-event-log") {
                                                bot.sendMessage(msg.channel.server.channels[i], msgArray);
                                            }
                                        }
                                    });
                                });
                            });
                        });
                    }
                }
            });
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
    if (msg.author !== bot.user && msg.content.toLowerCase().startsWith(bot.user) && msg.content.split(bot.user)[1] != "") {
        var cmdTxt = msg.content.split(" ")[1].toLowerCase();
        var suffix = msg.content.substring(cmdTxt.length + bot.user.mention().length + 2).toLowerCase();

        if (cmdTxt === "help") {
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
        else if (commands[cmdTxt]) {
            try {
                commands[cmdTxt].process(bot, msg, suffix);
            }
            catch (e) {
                
            }
        }
    }
});

bot.loginWithToken(authDetails.token, function (err) {
    if (err) {
        throw err;
    }
});
