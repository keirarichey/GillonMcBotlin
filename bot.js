
// Check FS
try {
	const fs = require('fs');
} catch (e) {
	console.log("fs missing. Run `npm install` first.");
	process.exit();
}

// Check Discord
try {
	const Discord = require("discord.js");
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
	const CONFIG = require("../config.json");
} catch (e) {
	console.log("Unable to parse config file: " + e);
	process.exit(1);
}

var bot = new Discord.Client({autoReconnect: true});

bot.OWNERID = CONFIG["owner"];
bot.PREFIX = CONFIG["prefix"];
bot.TOKEN = CONFIG["token"];

bot.COLOR = 0x345b95;
bot.SUCCESS_COLOR = 0x33b23b;
bot.ERROR_COLOR = 0xe24540;
bot.INFO_COLOR = 0xe2a640;

/*	Creates a message template to use in case of success,
 *	failure, or requiring info about the bot. Because it
 *	is a Discord embed, we can use colours and pictures.
 *
 *	@param {string} info
 *	@param {string} type
 *	@param {Message} msg
 */
bot.sendNotification = function(info, type, msg) {
	var icolor;
	
	if(type == "success") icolor = bot.SUCCESS_COLOR;
	else if(type == "error") icolor = bot.ERROR_COLOR;
	else if(type == "info") icolor = bot.INFO_COLOR;
	else icolor = bot.COLOR;
	
	let embed = {
		color: icolor,
		description: info
	}
	msg.channel.sendMessage("", {embed});
}

var commands = {}

/*	Creates a help message containing all the usable
 *	commands. Once again, as a Discord embed.
 *	It just looks nice, OK?
 *
 *	@param {Client} bot
 *	@param {Message} msg
 */
commands.help = {};
commands.help.args = "";
commands.help.help = "Display a list of usable commands.";
commands.help.main = function(bot, msg) {
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
		description: "Here are a list of commands you can use.",
		fields: cmds,
		footer: {
			icon_url: bot.user.avatarURL,
			text: bot.user.username
		}
	}
	
	msg.channel.sendMessage("", {embed});
}

/*	Adds a user-defined command to the commands list.
 *	The commands allowed are those specified in
 *	/commands/.
 *
 *	@param {Client} bot
 *	@param {Message} msg
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
}

/*	Removes a user-defined command to the commands
 *	list. The commands allowed are those specified
 *	in /commands/.
 *
 *	@param {Client} bot
 *	@param {Message} msg
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
			bot.sendNotification("Command not found.", "error", msg);
		}
	} else {
		bot.sendNotification("You do not have permission to use this command.", "error", msg);
	}
}

/*	To be honest I don"t quite know why this exists.
 *	I guess it"s for troubleshooting reasons.
 *
 *	@param {Client} bot
 *	@param {Message} msg
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
			msg.channel.sendMessage("Command not found");
		}
	} else {
		bot.sendNotification("You do not have permission to use this command.", "error", msg);
	}
}

/*	Grabs all command files in /commands/ and,
 *	once the .js part is trimmed off, adds it
 *	to commands[].
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
}

/*	Checks to see if a message follows the structure
 *	"@bot command" or "[prefix]command"
 *
 *	@param {Message} msg
 *	@param {boolean} isMention
 */
var checkCommand = function(msg, isMention) {
	if(isMention) {
		var command = msg.content.split(" ")[1];
		msg.content = msg.content.split(" ").splice(2, msg.content.split(" ").length).join(" ").toLowerCase();
		if(command) commands[command].main(bot, msg);
		// NOTE: THIS IF WILL LOAD THE WHOLE MESSAGE EXCEPT THE "@bot" part!
		// FOR US, WE NEED +TEAM [TEAM], SO WE NEED TO CREATE A NEW FUNCTION TO
		// PARSE OUR COMMANDS
		} else {
		var command = msg.content.split(bot.PREFIX)[1].split(" ")[0];
		msg.content = msg.content.replace(bot.PREFIX + command + " ", "").toLowerCase();
		if(command) commands[command].main(bot, msg);
		// SEE NOTE
	}
}

CLIENT.on('ready', () => {
    console.log(`--------------------------------------------------------`)
    console.log(`Logged in and successfully connected as ${CLIENT.user.username}.`)
    console.log(`Invite link: https://discordapp.com/oauth2/authorize?CLIENT_id=${CLIENT.user.id}&scope=bot&permissions=268446784`)
    console.log(`--------------------------------------------------------`);
    CLIENT.user.setGame("prefix: " + CONFIG.prefix);
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