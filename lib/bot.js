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
            if (cmd === command.name) {
                delete require.cache[require.resolve(`./commands/${file}`)];
                console.log(`Deleted module cache for: ./commands/${file}`);
                command = require(`./commands/${file}`);
                console.log(`Reloaded module: ./commands/${file}`);
            }
            if (!cmd || (cmd === command.name)) {
                // load any files if the cmd wasn't given, otherwise only load cmd
                client.COMMANDS.set(command.name, command);
                console.log(`Loaded command: ${command.name}`);
                if (command.aliases) {
                    console.log(`Available command aliases: ${command.aliases}`);
                }
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

    console.log(`\nErrors: ${errors}`);
    console.log(`===LOADING COMPLETED===\n`);
}

var welcome = function (msg, redditUsername) {
    var guild = msg.guild;
    var msgMember = guild.member(msg.author);
    var rulesChannel = guild.channels.resolve(client.CHANNELS.rulesChannel);
    var generalChannel = guild.channels.resolve(client.CHANNELS.generalChannel);
    var userLogChannel = guild.channels.resolve(client.CHANNELS.userLogChannel);
    var botChannel = guild.channels.resolve(client.CHANNELS.botChannel);

    msgMember.roles.add(client.ROLES.entryRole)
        .then(member => {
            var richEmbed = Discord.RichEmbed()
                .setDescription(`✅ Welcome, **${member.displayName}** to the r/AFL Discord Server! Don't forget to check the ${rulesChannel.toString()}, and head over to ${botChannel.toString()} to grab a team flair or check match scores!`)
                .setColor(client.SUCCESS_COLOUR)
            generalChannel.send(`<@${member.id}>`, richEmbed)
            userLogChannel.send(`${msg.author.tag} (created ${msg.author.createdAt}) is https://reddit.com/u/${redditUsername}`);
        });
}

var commandError = function (msg, commandName) {
    var richEmbed = Discord.RichEmbed()
        .setDescription(`❌ There was an error using this command:\n\`${commandName}\` is not a command.`)
        .setColor(client.ERROR_COLOUR);
    msg.channel.send(richEmbed)
        .catch(console.log('Could not send "Command does not exist" error.'));
}

var checkRedditUser = function (msg) {
    var msgMember = msg.guild.member(msg.author);

    if (member.roles.cache.has(client.ROLES.entryRole) || msg.author.bot) {
        return;
    }

    var usernameRegex = /\/?[uU](?:ser)?\/([A-Za-z0-9_-]+)/;

    var redditUser = msg.content.match(usernameRegex);

    if (redditUser === "YourUsername") {
        // Smart-asses.
        // TODO: Reddit username database.
        return;
    }

    if (redditUser) {
        redditAPI.getUser(redditUser[1]).fetch()
            .then(userInfo => {
                var d = new Date();
                var now = d.getTime(); // time in unix epoch milliseconds
                var twoWeeksAgo = now - 12096e5 //magic number: two weeks in ms
                if (userInfo.created_utc * 1000 <= twoWeeksAgo) {
                    welcome(msg, userInfo.name);
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
                var richEmbed = Discord.RichEmbed()
                    .setDescription(`The reddit account you provided doesn't exist or there was an error checking it. As an extension of r/AFL, we ask that you have a valid reddit account more than two weeks old to participate in the Discord server.\n\nIf there has been a mistake, please @Umpires for help.`)
                    .setColour(client.ERROR_COLOUR);
                msg.channel.send(richEmbed)
                    .catch(console.log('Could not send "Reddit account does not exist" error.'));
            })
    }
}

client.on("message", msg => {
    // Piggy-backing on message to check Reminder database
    var guild = msg.guild;
    var msgMember = msg.guild.member(msg.author);
    var welcomeChannel = guild.channels.resolve(client.CHANNELS.welcomeChannel);
    var botChannel = guild.channels.resolve(client.CHANNELS.botChannel);

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

    if (!command) {
        if (msg.channel === botChannel) {
            commandError(msg, commandName);
        }
        return;
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

    if (command.modOnly && !msgMember.roles.cache.has(client.ROLES.modRole)) {
        var noPermissionEmote = guild.emojis.resolve(client.EMOTES.noPermissionEmote);
        var richEmbed = Discord.RichEmbed()
            .setDescription(`${noPermissionEmote} You do not have permission to use that command. You must have the Umpires role to use this command.`)
            .setColor(client.ERROR_COLOUR);
        msg.channel.send(richEmbed)
            .catch(console.log('Could not send command permission error.'));
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
        var richEmbed = Discord.RichEmbed()
            .setDescription(errorEmbedText)
            .setColor(client.ERROR_COLOUR);
        msg.channel.send(richEmbed)
            .catch(console.log('Could not send "Command missing arguments" error.'));
        return;
    }

    try {
        command.execute(msg, args, client);
    } catch (e) {
        if (client.DETAILED_LOGGING) {
            console.log(
                `RunCommand Error:\n` +
                `${e}\n` +
                `Author: ${msg.author.tag}\n` +
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
    var msgMember = msg.guild.member(msg.author);
    var deletedMessageChannel = guild.channels.resolve(client.CHANNELS.deletedMessageChannel);
    var msgDateTime = msg.createdAt.toUTCString();
    var fileString = "";

    if (!msg.author.bot && msg.cleanContent.charAt(0) !== "+") {
        var richEmbed = Discord.RichEmbed()
            .setThumbnail(msg.author.avatarURL)
            .setColor(client.COLOUR)
            .setTitle(`[${msgDateTime}] ${msg.author.tag} (${msgMember.displayName}) in #${msg.channel.name}:`)
            .setDescription(msg.cleanContent)
            .setTimestamp(new Date())
            .setImage(msg.attachments.first().url);
        
        deletedMessageChannel.send(richEmbed)
            .catch(console.log('Could not send deleted message embed to deletedMessageChannel.'));
    }
});

client.on("guildMemberAdd", member => {
    var guild = member.guild;
    var welcomeChannel = guild.channels.resolve(client.CHANNELS.welcomeChannel);

    var welcomeText = `✅ **${member.displayName}**, ` +
        `Welcome to r/AFL! Everything Australian Football, now on Discord! To access the main channels, ` +
        `you'll need to provide us a link to your reddit profile or your reddit name.\n` +
        `To get the system to work, please just type /u/YourUsername (or just u/YourUsername), or post a link.\n\n` +
        `This is just to prevent spam, and we require your account is at least two weeks old.`;

    var richEmbed = Discord.RichEmbed()
        .setDescription(welcomeText)
        .setColor(client.SUCCESS_COLOUR);
    welcomeChannel.send(`<@${member.id}>`, richEmbed)
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
    var exitEmote = guild.emojis.resolve(client.EMOTES.exitEmote);
    var generalChannel = guild.channels.resolve(client.CHANNELS.generalChannel);
    var welcomeChannel = guild.channels.resolve(client.CHANNELS.welcomeChannel);

    var goodbyeText = `❌ **${member.displayName}** just retired from **r/AFL**. ` +
        `Please celebrate as we chair **${member.displayName}** off.`
    //`\<:chair:445099687402536960>`;

    var richEmbed = Discord.RichEmbed()
        .setDescription(`❌ **${member.displayName}** just retired from **r/AFL**. Please celebrate as we chair **${member.displayName}** off.`)
        .setColor(client.ERROR_COLOUR)

    if (member.roles.cache.has(client.ROLES.entryRole)) {
        generalChannel.send(richEmbed)
            .then(sentMsg => {
                sentMsg.react(exitEmote);
            })
            .catch(e => {
                console.log(
                    `SendGoodbye Error:\n` +
                    `${e}\n` +
                    `Member: ${member.displayName}\n` +
                    `Channel: ${generalChannel.name}\n`
                );
            });
    } else {
        welcomeChannel.send(richEmbed)
            .then(sentMsg => {
                sentMsg.react(exitEmote);
            })
            .catch(e => {
                console.log(
                    `SendGoodbye Error:\n` +
                    `${e}\n` +
                    `Member: ${member.displayName}\n` +
                    `Channel: ${welcomeChannel.name}\n`
                );
            });
    }
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
    var guild = newMember.guild;

    if (!oldMember.roles.cache.has(client.ROLES.entryRole) && newMember.roles.cache.has(client.ROLES.entryRole)) {
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

    // Poll the reminders database every minute
    var reminderInterval = setInterval(pollReminders, 60000);

    function pollReminders() {
        var now = moment().format("YYYY-MM-DD HH:mm:ss");
        var query = con.query("SELECT * FROM reminders WHERE `new_date` < ?;", [
            [now]
        ]);

        // List of reminderIDs to delete from database
        var toDelete = new Array();

        query.on("error", err => {
            if (err) {
                console.log(err);
            }
        });

        query.on("result", row => {
            var richEmbed = Discord.RichEmbed()
                .setDescription(`⌚ You requested a reminder on ${moment(row.origin_date).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")} to remind you:\n\`${row.note}\``)
                .setFooter(`This reminder was due ${moment(row.new_date).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")}, and delivered ${moment(now).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")}. If this was not on time, please message ZedFish#2430.`)
            client.users.fetch(row.userID)
                .then(user => {
                    if (!user.dmChannel) {
                        user.createDM()
                            .then(channel => {
                                channel.send(richEmbed);
                            });
                    } else {
                        user.dmChannel.send(richEmbed);
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
    }
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
