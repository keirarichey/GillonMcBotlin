
// Check FS
try {
    var fs = require('fs');
} catch (e) {
    console.log("fs missing. Run `npm install` first.");
    process.exit();
}

// Check Discord
try {
    var Discord = require("discord.js");
} catch (e) {
    console.log("Discord.js missing. Run `npm install` first.");
    process.exit();
}

// Check config file exists
try {
    require.resolve("../config.json");
} catch (e) {
    console.log("Configuration config.json missing. Copy config.json.dist to config.json, edit it and re-run the script.");
    process.exit();
}

// Load config file
try {
    var config = require("../config.json");
} catch (e) {
    console.log("Unable to parse config file: " + e);
    process.exit(1);
}

var bot = new Discord.Client({autoReconnect: true});

bot.OWNERID = config.owner;
bot.PREFIX = config.prefix;
bot.TOKEN = config.token;

bot.DETAILED_LOGGING = true;
bot.DELETE_COMMANDS = true;

bot.COLOR = 0x345b95;
bot.SUCCESS_COLOR = 0x33b23b;
bot.ERROR_COLOR = 0xe24540;
bot.INFO_COLOR = 0xe2a640;

/*  Creates a message template to use in case of success,
 *  failure, or requiring info about the bot. Because it
 *  is a Discord embed, we can use colours and pictures.
 *
 *  @param {string} info
 *  @param {string} type
 *  @param {Message} msg
 */
bot.sendNotification = function (info, type, msg) {
    var icolor;

    if (type === "success") {
        icolor = bot.SUCCESS_COLOR;
    } else if (type === "error") {
        icolor = bot.ERROR_COLOR;
    } else if (type === "info") {
        icolor = bot.INFO_COLOR;
    } else {
        icolor = bot.COLOR;
    }

    var embed = {
        color: icolor,
        description: info
    };
    msg.channel.send("", {embed});
};

bot.sendWelcome = function (info, type, channel) {
    var icolor;

    if (type === "success") {
        icolor = bot.SUCCESS_COLOR;
    } else if (type === "error") {
        icolor = bot.ERROR_COLOR;
    } else if (type === "info") {
        icolor = bot.INFO_COLOR;
    } else {
        icolor = bot.COLOR;
    }

    var embed = {
        color: icolor,
        description: info
    };
    channel.send("", {embed});
};

var commands = {};

/*  Creates a help message containing all the usable
 *  commands. Once again, as a Discord embed.
 *  It just looks nice, OK?
 *
 *  @param {Client} bot
 *  @param {Message} msg
 */
commands.help = {};
commands.help.args = "";
commands.help.help = "Display a list of usable commands.";
commands.help.main = function (bot, msg) {
    var cmds = [];

    for (let command in commands) {
        if (!commands[command].hide) {
            cmds.push({
                name: bot.PREFIX + command,
                value: commands[command].help,
                inline: true
            });
        }
    }
    
    let embed = {
        color: bot.COLOR,
        title: "Help Menu",
        description: "Here are a list of commands you can use.",
        fields: cmds,
        timestamp: new Date(),
        footer: {
            icon_url: bot.user.avatarURL,
            text: `${bot.user.username}`
        }
    };
    
    msg.channel.send("", {embed});
};

/*  Adds a user-defined command to the commands list.
 *  The commands allowed are those specified in
 *  /commands/.
 *
 *  @param {Client} bot
 *  @param {Message} msg
 */
commands.load = {};
commands.load.args = "<command>";
commands.load.help = "";
commands.load.hide = true;
commands.load.main = function(bot, msg) {
    if(msg.author.id == bot.OWNERID) {
        try {
            delete commands[msg.content];
            delete require.cache[__dirname+"/commands/"+ msg.content +".js"];
            commands[msg.content] = require(__dirname+"/commands/"+ msg.content +".js");
            bot.sendNotification("Loaded " + msg.content + ".js succesfully.", "success", msg);
        } catch(err) {
            bot.sendNotification("The command was not found, or there was an error loading it.", "error", msg);
        }
    } else {
        bot.sendNotification("You do not have permission to use this command.", "error", msg);
    }
};

/*  Removes a user-defined command to the commands
 *  list. The commands allowed are those specified
 *  in /commands/.
 *
 *  @param {Client} bot
 *  @param {Message} msg
 */
commands.unload = {};
commands.unload.args = "<command>";
commands.unload.help = "";
commands.unload.hide = true;
commands.unload.main = function(bot, msg) {
    if (msg.author.id == bot.OWNERID){
        try {
            delete commands[msg.content];
            delete require.cache[__dirname+"/commands/" + msg.content + ".js"];
            bot.sendNotification("Unloaded " + msg.content + ".js succesfully.", "success", msg);
        }
        catch(err){
            bot.sendNotification("The command was not found, or there was an error loading it.", "error", msg);
        }
    } else {
        bot.sendNotification("You do not have permission to use this command.", "error", msg);
    }
};

/*  To be honest I don"t quite know why this exists.
 *  I guess it"s for troubleshooting reasons.
 *
 *  @param {Client} bot
 *  @param {Message} msg
 */
commands.reload = {};
commands.reload.args = "";
commands.reload.help = "";
commands.reload.hide = true;
commands.reload.main = function(bot, msg) {
    if (msg.author.id == bot.OWNERID){
        try {
            delete commands[msg.content];
            delete require.cache[__dirname+"/commands/" + msg.content +".js"];
            commands[args] = require(__dirname+"/commands/" + msg.content +".js");
            bot.sendNotification("Reloaded " + msg.content + ".js successfully.", "success", msg);
        }
        catch(err){
            bot.sendNotification("The command was not found, or there was an error loading it.", "error", msg);
        }
    } else {
        bot.sendNotification("You do not have permission to use this command.", "error", msg);
    }
};

/*  Grabs all command files in /commands/ and,
 *  once the .js part is trimmed off, adds it
 *  to commands[].
 */
var loadCommands = function() {
    var files = fs.readdirSync(__dirname+"/commands");
    for (let file of files) {
        if (file.endsWith(".js")) {
            commands[file.slice(0, -3)] = require(__dirname+"/commands/"+file);
            if(bot.DETAILED_LOGGING) console.log("Loaded " + file);
        }
    }
    console.log("———— All Commands Loaded! ————");
};

/*  Checks to see if a message follows the structure
 *  "@bot command" or "[prefix]command"
 *
 *  @param {Message} msg
 *  @param {boolean} isMention
 */
var checkCommand = function(msg, isMention) {
    if(isMention) {
        var command = msg.content.split(" ")[1].toLowerCase();
        msg.content = msg.content.split(" ").splice(2, msg.content.split(" ").length).join(" ").toLowerCase();
        command = command.toLowerCase();
        try {
            commands[command].main(bot, msg);
        } catch (e) {
            bot.sendNotification(`The command \`${command}\` does not exist or there was an error using it.`, "error", msg);
            console.log(e);
        }
    } else {
        var command = msg.content.split(bot.PREFIX)[1].split(" ")[0];
        msg.content = msg.content.replace(bot.PREFIX + command + " ", "").toLowerCase();
        command = command.toLowerCase();
        try {
            commands[command].main(bot, msg);
        } catch (e) {
            bot.sendNotification(`The command \`${command}\` does not exist or there was an error using it.`, "error", msg);
            console.log(e);
        }
    }
};

var startService = function(msg, service) { // SPECTATORBOT FUNCTIONALITY
    try {
        services[service] = require(__dirname+"/services/"+ service +".js");
    } catch (e) {
        console.log(`The service \`${service}\` could not be found. Please ensure it is inside the GillonMcBotlin/lib/sevices/ directory`);
        console.log(e);
    }
    try {
        services[service].main(bot, msg);
    } catch (e) {
        console.log(`The service \`${service}\` does not exist or there was an error using it.`);
        console.log(e);
    }
};

bot.on("message", msg => {
    const bot_channel = msg.guild.channels.find("id", "253192230200803328"); //bot_spam
    const match_fta = msg.guild.channels.find("id", "193362778646511617"); //match_discussion_fta
    const match_fox = msg.guild.channels.find("id", "250245406657740801"); //match_discussion_fox
    var match_channels = [match_fta, match_fox];
    if (msg.channel == bot_channel) {
        if (msg.content.startsWith('<@'+bot.user.id+'>') || msg.content.startsWith('<@!'+bot.user.id+'>')) {
            checkCommand(msg, true);
            if(bot.DELETE_COMMANDS) msg.delete();
        } else if (msg.content.startsWith(bot.PREFIX)) {
            checkCommand(msg, false);
            if(bot.DELETE_COMMANDS) msg.delete();
        }
    } else if (match_channels.indexOf(msg.channel) >= 0) {
        /*if (/(?<hometeam><:.*:)\d*> (?<versus>🆚) <(?<awayteam>:.*:)\d*>/.test(msg.content)) {
            startService(msg, "spectator");
        }*/ //Regex is invalid. Investigate.
    }
});

bot.on("guildMemberAdd", member => {
    const SERVER = member.guild;
    var welcomeChannel = SERVER.channels.find("id", "295589980733046784");
    
    bot.sendWelcome(`<:white_check_mark:364924816261906432> **${member.displayName}**, Welcome to r/AFL! Everything Australian Football, now on Discord! To access the main channels, you'll need to provide us a link to your reddit profile or your reddit name.`, "success", welcomeChannel);
});

bot.on("guildMemberRemove", member => {
	var confirmedRole = "283573666351022081";
    const SERVER = member.guild;
    var welcomeChannel = SERVER.channels.find("id", "295589980733046784");
    var offTopicChannel = SERVER.channels.find("id", "193359073431912449");
    if (member.roles.exists(confirmedRole)) {
    	bot.sendWelcome(`<:x:364941928070119424> **${member.displayName}** just retired from **r/AFL**. Please celebrate as we chair **${member.displayName}** off.`, "error", offTopicChannel);
    }
    bot.sendWelcome(`<:x:364941928070119424> **${member.displayName}** just retired from **r/AFL**. Please celebrate as we chair **${member.displayName}** off.`, "error", welcomeChannel);
});

bot.on("guildMemberUpdate", (oldMember, newMember) => {
    const SERVER = newMember.guild;
	var offTopicChannel = SERVER.channels.find("id", "193359073431912449");
	var confirmedRole = "283573666351022081";

	console.log(oldMember);
	console.log(newMember);

	if (oldMember.roles.exists(confirmedRole)) {
		return;
	} else if (newMember.roles.exists(confirmedRole)) {
		bot.sendWelcome(`<:white_check_mark:364924816261906432> **${newMember.displayName}**, Welcome to r/AFL! Everything Australian Football, now on Discord!`, "success", offTopicChannel);
	}
});

bot.on('ready', () => {
    console.log(`--------------------------------------------------------`);
    console.log(`Logged in and successfully connected as ${bot.user.username}.`);
    console.log(`Invite link: https://discordapp.com/oauth2/authorize?CLIENT_id=${bot.user.id}&scope=bot&permissions=268446784`);
    console.log(`--------------------------------------------------------`);
    bot.user.setGame("prefix: " + config.prefix);
    bot.user.setStatus("online", "");
    loadCommands();
});

bot.on('error', (err) => {
    console.log("————— BIG ERROR —————");
    console.log(err);
    console.log("——— END BIG ERROR ———");
});

bot.on("disconnected", () => {
    console.log("Disconnected!");
});

bot.login(bot.TOKEN);