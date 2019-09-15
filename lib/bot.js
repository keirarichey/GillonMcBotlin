var fs = require("fs");
var Discord = require("discord.js");
var moment = require("moment");
var mysql = require("mysql");
var Snoowrap = require("snoowrap");

try {
    var config = require("../config.json");
    var redditConfig = require("../reddit_config.json");
} catch (e) {
    console.log("Unable to parse config file: " + e);
    process.exit(1);
}

var client = new Discord.Client({
    autoReconnect: true
});

client.OWNERID = config.owner;
client.PREFIX = config.prefix;
client.TOKEN = config.token;

client.DETAILED_LOGGING = true;
client.DELETE_COMMANDS = false;

client.COLOUR = 0x345b95; // blue
client.SUCCESS_COLOUR = 0x33b23b; // green
client.ERROR_COLOUR = 0xe24540; // red
client.INFO_COLOUR = 0xe2a640; // yellow

client.COMMANDS = new Discord.Collection();

client.CHANNELS = {
    "userLogChannel": "280250705946607618",
    "welcomeChannel": "387580588850151424",
    "generalChannel": "193359073431912449",
    "modChannel": "271391673236455428",
    "rulesChannel": "193315916484706305",
    "botChannel": "253192230200803328",
    "deletedMessageChannel": "412612544436633600",
    "restrictedChannels": [ // channels that normal users can't post in
        "271391673236455428",
        "280250705946607618",
        "387580588850151424",
        "193315916484706305"
    ]
};

client.ROLES = {
    "entryRole": "283573666351022081", // Confirmed
    "modRole": "193317014964666368" // Umpires
}

client.EMOTES = {
    "exitEmote": "445099687402536960", // :chair:
    "badArgumentEmote": "246541254182174720", // :bt:
    "noPermissionEmote": "411107473907515392" // :gil:
}

var redditOptions = {
    userAgent: redditConfig.user_agent,
    clientId: redditConfig.client_id,
    clientSecret: redditConfig.client_secret,
    username: redditConfig.username,
    password: redditConfig.password,
};
var redditAPI = new Snoowrap(redditOptions);

var mysqlUser = config.dbuser;
var mysqlPass = config.dbpass;
var con = mysql.createConnection({
    host: "localhost",
    user: mysqlUser,
    password: mysqlPass,
    database: "remindme"
});
con.connect(err => {
    if (err) {
        console.log(err);
    }
});

/*	Loads files from folder structure. Gets all
 *	files from all directories in lib/ that match
 *	the names given in commandFolders.
 */
client.loadCommand = function (cmd) {
    var errors = 0;
    if (!cmd) {
        client.COMMANDS = new Discord.Collection();
    }
    fs.readdirSync(`./commands`).forEach(function (file) {
        try {
            var command = require(`./commands/${file}`);
            if (!cmd || (cmd === command.name)) {
                // load any files if the cmd wasn't given, otherwise only load cmd
                client.COMMANDS.set(command.name, command);
                console.log(`Loaded command: ${command.name}`);
            }
        } catch (e) {
            if (client.DETAILED_LOGGING) {
                console.log(
                    `LoadCommand Error:` +
                    `\n${e}` +
                    `\nCommand File: ${file}\n`
                );
                errors++;
            }
        }
    });
    fs.writeFile("../data/commands.json", JSON.stringify(COMMANDS), (err) => {
        if (err) {
            console.log(err);
        }
    });
    console.log(`\nErrors: ${errors}`);
    console.log(`===LOADING COMPLETED===\n`);
}

var welcome = function (msg, redditUser) {
    var guild = msg.guild;
    var rulesChannel = guild.channels.get(client.CHANNELS.rulesChannel);
    var generalChannel = guild.channels.get(client.CHANNELS.generalChannel);
    var userLogChannel = guild.channels.get(client.CHANNELS.userLogChannel);
    var botChannel = guild.channels.get(client.CHANNELS.botChannel);

    msg.member.addRole(client.ROLES.entryRole);

    var welcomeEmbedText = `✅ Welcome, **${msg.member.displayName}** to the r/AFL Discord Server! Don't forget to check the ` +
        `${rulesChannel.toString()}, and head over to ${botChannel.toString()} to grab a team flair or check match scores!`

    generalChannel.send(`<@${msg.member.id}>`, {
        embed: {
            color: client.SUCCESS_COLOUR,
            description: welcomeEmbedText
        }
    });

    userLogChannel.send(`${msg.author.tag} (created ${msg.author.createdAt}) is https://reddit.com/u/${redditUser}`);
    return;
}

var modError = function (msg) {
    var guild = msg.guild;
    var modChannel = guild.channels.get(client.CHANNELS.generalChannel);

    modChannel.send(`Hey guys, I'm having an issue in #welcome, can somebody take a look? They may have posted their Reddit username in a sentence where I can't reach it.`);
}

var commandError = function (msg, commandName) {
    var errorEmbedText = `❌ There was an error using this command:\n\`${commandName}\` is not a command.`
    msg.channel.send({
        embed: {
            color: client.ERROR_COLOUR,
            description: errorEmbedText
        }
    });
}

var checkRedditUser = function (msg) {
    if (msg.member.roles.has(client.ROLES.entryRole) || msg.author.bot) {
        return;
    }

    var usernameRegex = /\/u\/([A-Za-z0-9_-]+)/;

    var redditUser = msg.content.match(usernameRegex);

    if (redditUser === "YourUsername") {
        // Smart-asses.
        // TODO: Reddit username database.
        return;
    }

    if (redditUser) {
        try {
            redditAPI.getUser(redditUser[1]).created
                .then(time => {
                    var d = new Date();
                    var now = d.getTime(); // time in unix epoch milliseconds
                    var twoWeeksAgo = now - 12096e5 //magic number: two weeks in ms
                    if (time * 1000 <= twoWeeksAgo) {
                        welcome(msg, redditUser[1]);
                        return;
                    } else {
                        var newRedditEmbedText = `If you've provided a Reddit account, it's less than two weeks old. ` +
                            `The rules of the server require users to have been on reddit for longer than ` +
                            `two weeks, and we'll be more than happy to let you in once those two weeks are up, ` +
                            `just post your reddit username again when the time comes.\n\nIf there has been a ` +
                            `mistake, please @Umpires for help.`
                        msg.channel.send({
                            embed: {
                                color: client.INFO_COLOUR,
                                description: newRedditEmbedText
                            }
                        });
                        return;
                    }
                })
                .catch((e) => {
                    console.log(e)
                    console.log(`Reddit User does not exist: ${redditUser[1]}`);
                    var noRedditEmbedText = `The reddit account you provided doesn't exist or there was an error checking it. As an extension of r/AFL, we ask` +
                        `that you have a valid reddit account more than two weeks old to participate in the ` +
                        `Discord server.\n\nIf there has been a mistake, please @Umpires for help.`
                    msg.channel.send({
                        embed: {
                            color: client.ERROR_COLOUR,
                            description: noRedditEmbedText
                        }
                    });
                    return;
                })
        } catch (e) {

        }
    } else {
        msg.channel.search({
                author: msg.member
            })
            .then(res => {
                if (res.totalResults <= 1) {
                    modError(msg);
                    return;
                } else {
                    return;
                }
            })
    }
}

client.on("message", msg => {
    // Piggy-backing on message to check Reminder database
    var now = moment().format("YYYY-MM-DD HH:mm:ss");
    var guild = msg.guild;
    var welcomeChannel = guild.channels.get(client.CHANNELS.welcomeChannel);
    var botChannel = guild.channels.get(client.CHANNELS.botChannel);
    var member = msg.member;

    // List of reminderIDs to delete from database
    var toDelete = new Array();

    var query = con.query("SELECT * FROM reminders WHERE `new_date` < ?;", [
        [now]
    ]);

    query.on("error", err => {
        if (err) {
            console.log(err);
        }
    });

    query.on("result", row => {
        var remindText = `⌚ You requested a reminder on ${moment(row.origin_date).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")} to remind you:\n` +
            `\`${row.note}\``;
        var remindFoot = `This reminder was due ${moment(row.new_date).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")}, and delivered ` +
            `${moment(now).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")}. If this was not on time, please message ZedFish#2430.`;
        client.fetchUser(row.userID)
            .then(user => {
                if (!user.dmChannel) {
                    user.createDM()
                        .then(channel => {
                            channel.send({
                                embed: {
                                    color: client.COLOUR,
                                    description: remindText,
                                    footer: {
                                        text: remindFoot
                                    }
                                }
                            });
                        });
                } else {
                    user.dmChannel.send({
                        embed: {
                            color: client.COLOUR,
                            description: remindText,
                            footer: {
                                text: remindFoot
                            }
                        }
                    });
                }
            });
        toDelete.push(row.reminderID);
    });

    query.on("end", () => {
        for (var id of toDelete) {
            con.query("DELETE FROM `reminders` WHERE \`reminderID\` = ?", [
                [id]
            ]);
        }
    });

    // OK, now on to normal message handling

    // Check reddit username for entry
    if (msg.channel === welcomeChannel) {
        checkRedditUser(msg);
    }

    if (!msg.content.startsWith(client.PREFIX) || msg.author.bot) {
        return;
    }

    // Remove prefix from message
    var cont = msg.content.slice(client.PREFIX.length).split(/ +/);
    // Grab the word previously attached to the prefix as a command name
    var commandName = cont.shift().toLowerCase();
    // ...and use what's left of the message as arguments for the command
    var args = cont.join(" ").toLowerCase();

    var command = client.COMMANDS.get(commandName) ||
        client.COMMANDS.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    for (var key of client.COMMAND.keys()) {
        console.log()
        console.log(client.COMMANDS[key].name)
        console.log(client.COMMANDS[key].aliases)
        console.log(cmd.aliases.includes(commandName))
        console.log()
    }

    if (!command) {
        if (msg.channel === botChannel) {
            commandError(msg, commandName);
            return;
        }
    }

    // reload the given command before running it
    // client.loadCommand(command);

    if (command.botChannelOnly && msg.channel !== botChannel) {
        return;
    }

    if (command.guildOnly && msg.channel.type !== "text") {
        msg.reply("I can only run this command inside the r/AFL Discord Server.");
        return;
    }

    if (command.modOnly && !member.roles.has(client.ROLES.modRole)) {
        var noPermissionEmote = guild.emojis.get(client.EMOTES.noPermissionEmote);
        var permissionText = `${noPermissionEmote} You do not have permission to use that command. You must have the Umpires role to use this command.`;
        msg.channel.send({
            embed: {
                color: client.ERRORCOLOUR,
                description: permissionText
            }
        });
        return;
    }

    if (command.args && !args) {
        var errorEmbedText = `❌ There was an error using this command:\n\`${command.name}\` requires at least one argument.`
        if (!command.args) {
            errorEmbedText += `\nThe correct usage is: \`${client.PREFIX}${command.name}\``;
        } else {
            errorEmbedText += `\nThe correct usage is: \`${client.PREFIX}${command.name} ${command.usage}\``;
        }
        if (command.aliases) {
            errorEmbedText += `\nOther usages allowed are:`
            for (var alias in command.aliases) {
                if (!command.usage) {
                    errorEmbedText += `\n\`${client.PREFIX}${command.aliases[alias]}\``;
                } else {
                    errorEmbedText += `\n\`${client.PREFIX}${command.aliases[alias]} ${command.usage}\``;
                }
            }
        }
        msg.channel.send({
            embed: {
                color: client.ERRORCOLOUR,
                description: errorEmbedText
            }
        });
        return;
    }

    try {
        command.execute(msg, args, client);
    } catch (e) {
        if (client.DETAILED_LOGGING) {
            console.log(
                `RunCommand Error:\n` +
                `${e}\n` +
                `Author: ${msg.member}\n` +
                `Message: ${msg.content}\n`
            );
        }
    }

    if (client.DELETE_COMMANDS) {
        msg.delete();
    }
});

client.on("messageDelete", msg => {
    var guild = msg.guild;
    var deletedMessageChannel = guild.channels.get(client.CHANNELS.deletedMessageChannel);
    var msgAuthor = msg.member;
    var msgContent = msg.cleanContent;
    var msgChannel = msg.channel;
    var msgDateTime = msg.createdAt;
    var fileString = "";

    if (msg.attachments.size > 0) {
        fileString += msg.attachments.first().url;
    }

    if (msgAuthor.nickname) {
        var msgAuthorName = msgAuthor.displayName;
    } else {
        var msgAuthorName = msgAuthor.username;
    }

    if (!msgAuthor.bot && msgContent.charAt(0) !== "+") {
        deletedMessageChannel.send({
            embed: {
                thumbnail: {
                    url: msgAuthor.avatarURL
                },
                color: client.COLOUR,
                title: `[${msgDateTime}] ${msgAuthor.tag} (${msgAuthorName}) in #${msgChannel.name}:`,
                description: msgContent,
                image: {
                    url: fileString
                },
                timestamp: new Date()
            }
        });
    }
});

client.on("guildMemberAdd", member => {
    var guild = member.guild;
    var welcomeChannel = guild.channels.get(client.CHANNELS.welcomeChannel);

    var welcomeText = `✅ **${member.displayName}**, ` +
        `Welcome to r/AFL! Everything Australian Football, now on Discord! To access the main channels, ` +
        `you'll need to provide us a link to your reddit profile or your reddit name.\n` +
        `To get the system to work, please just type /u/YourUsername (or just u/YourUsername), or post a link.\n\n` +
        `This is just to prevent spam, and we require your account is at least two weeks old.`;

    welcomeChannel.send(`<@${member.id}>`, {
            embed: {
                color: client.SUCCESS_COLOUR,
                description: welcomeText
            }
        })
        .catch(e => {
            console.log(
                `SendWelcome Error:\n` +
                `${e}\n` +
                `Member: ${member.displayName}\n` +
                `Channel: ${welcomeChannel.name}\n`
            );
        });
});

client.on("guildMemberRemove", member => {
    var guild = member.guild;
    var exitEmote = guild.emojis.get(client.EMOTES.exitEmote);
    var generalChannel = guild.channels.get(client.CHANNELS.generalChannel);
    var welcomeChannel = guild.channels.get(client.CHANNELS.welcomeChannel);

    var goodbyeText = `❌ **${member.displayName}** just retired from **r/AFL**. ` +
        `Please celebrate as we chair **${member.displayName}** off.`
    //`\<:chair:445099687402536960>`;

    if (member.roles.has(client.ROLES.entryRole)) {
        generalChannel.send({
                embed: {
                    color: client.ERROR_COLOUR,
                    description: goodbyeText
                }
            })
            .then(sentMsg => {
                sentMsg.react(exitEmote);
            })
            .catch(e => {
                console.log(
                    `SendWelcome Error:\n` +
                    `${e}\n` +
                    `Member: ${member.displayName}\n` +
                    `Channel: ${generalChannel.name}\n`
                );
            });
    } else {
        welcomeChannel.send({
                embed: {
                    color: client.ERROR_COLOUR,
                    description: goodbyeText
                }
            })
            .then(sentMsg => {
                sentMsg.react(exitEmote);
            })
            .catch(e => {
                console.log(
                    `SendWelcome Error:\n` +
                    `${e}\n` +
                    `Member: ${member.displayName}\n` +
                    `Channel: ${welcomeChannel.name}\n`
                );
            });
    }
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
    var guild = newMember.guild;

    if (!oldMember.roles.has(client.ROLES.entryRole) && newMember.roles.has(client.ROLES.entryRole)) {
        //console.log(`${oldMember.roles}\n\n${newMember.roles}`)
    }
});

client.on("ready", () => {
    // Load all commands
    client.loadCommand();
    console.log()
    console.log(`--------------------------------------------------------`);
    console.log(`Logged in and successfully connected as ${client.user.username}.`);
    console.log(`Invite link: https://discordapp.com/oauth2/authorize?CLIENT_id=${client.user.id}&scope=bot&permissions=268446784`);
    console.log(`--------------------------------------------------------`);
    client.user.setActivity("prefix: " + config.prefix);
    client.user.setStatus("online", "");
});

client.on("error", (err) => {
    console.log("————— BIG ERROR —————");
    console.log(err);
    console.log("——— END BIG ERROR ———");
});

client.on("disconnected", () => {
    console.log("Disconnected!");
});

client.login(client.TOKEN);