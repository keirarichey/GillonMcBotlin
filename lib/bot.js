
// Check FS
try {
	var fs = require('fs');
}
catch (e) {
	console.log("fs missing. Run `npm install` first.");
	process.exit();
}

// Check Discord
try {
	var Discord = require("discord.js");
}
catch (e) {
	console.log("Discord.js missing. Run `npm install` first.");
	process.exit();
}

// Import Moment
try {
	var moment = require("moment");
} catch (e) {
	console.log("moment missing. Run `npm install` first.");
	error = true;
}

// Import mysql
try {
	var mysql = require("mysql");
} catch (e) {
	console.log("mysql missing. Run `npm install` first.");
	error = true;
}

// Check config file exists
try {
	require.resolve("../config.json");
}
catch (e) {
	console.log("Configuration config.json missing. Copy config.json.dist to config.json, edit it and re-run the script.");
	process.exit();
}

// Load config file
try {
	var config = require("../config.json");
}
catch (e) {
	console.log("Unable to parse config file: " + e);
	process.exit(1);
}

// Load message format methods
try {
	var formatMessage = require('./formatmessage.js');
}
catch (e) {
	console.log("Unable to load message formatting methods:\n" + e);
	process.exit(1);
}

var client = new Discord.Client({autoReconnect: true});

client.OWNERID          = config.owner;
client.PREFIX           = config.prefix;
client.TOKEN            = config.token;

client.DETAILED_LOGGING = true;
client.DELETE_COMMANDS  = false;

client.COLOR            = 0x345b95; // blue
client.SUCCESS_COLOR    = 0x33b23b; // green
client.ERROR_COLOR      = 0xe24540; // red
client.INFO_COLOR       = 0xe2a640; // yellow

client.COMMANDS         = new Discord.Collection();

var commandFolders    = ["commands", "commandsMod", "commandsScore"];

/*	Loads files from folder structure. Gets all
 *	files from all directories in lib/ that match
 *	the names given in commandFolders.
 */
var loadCommands = function() {
	var errors = 0;
	for (var folder of commandFolders) {
		var commandFiles = fs.readdirSync(`./${folder}`);
		for (var file of commandFiles) {
			try {
				var command = require(`./${folder}/${file}`);
				client.COMMANDS.set(command.name, command);
				console.log(`Loaded command: ${command.name}`);
			} catch (e) {
				if (client.DETAILED_LOGGING) {
					console.log(`LoadCommand Error:`+
								`\n${e}`+
								`\nCommand File: ${file}`);
					errors++;
				}
			}
		}
		console.log(`---${folder.toUpperCase()} COMPLETED---`);
	}
	console.log(`\nErrors: ${errors}`);
	console.log(`===LOADING COMPLETED===\n`);
}

client.on("message", msg => {
	if (!msg.content.startsWith(client.PREFIX) || msg.author.bot) return;

	// Remove prefix from message
	var cont			= msg.content.slice(client.PREFIX.length).split(/ +/);
	// Grab the word previously attached to the prefix as a command name
	var commandName		= cont.shift().toLowerCase();
	// ...and use what's left of the message as arguments for the command
	var args			= cont.join(" ").toLowerCase();

	var command =	client.COMMANDS.get(commandName)
					|| client.COMMANDS.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) {
    	var embedText	=	`❌ There was an error using this command:\n\`${commandName}\` is not a command.`
		formatMessage.sendNotification(embedText, "error", msg);
		return;
    }

	if (command.guildOnly && msg.channel.type !== 'text') {
		message.reply('I can only run this command inside the r/AFL Discord Server.');
		return;
	}

	if (command.args && !args.length) {
		var embedText	=	`❌ There was an error using this command:\n\`${command.name}\` requires at least one argument.`
		if (command.usage) {
			embedText += `\nThe correct usage is: \`${client.PREFIX}${command.name} ${command.usage}\``;
			if (command.aliases) {
				embedText += `\n Other usages allowed are:`
				for (var alias in command.aliases) {
					embedText += `\n\`${client.PREFIX}${command.aliases[alias]} ${command.usage}\``;
				}
			}
		}

		formatMessage.sendNotification(embedText, "error", msg);
		return;
	}

	//if (!client.COMMANDS.has(commandName)) {
	//	var embedText	=	`❌ There was an error using this command:\n\`${commandName}\` is not a command.`
	//	formatMessage.sendNotification(embedText, "error", msg);
	//	return;
	//}

	try {
		command.execute(msg, args);
	} catch (e) {
		if (client.DETAILED_LOGGING) {
			console.log(`RunCommand Error:\n`+
						`${e}\n`+
						`Author: ${msg.author}\n`+
						`Message: ${msg.content}`);
		}
	}

	if(client.DELETE_COMMANDS) msg.delete();

	// Pigg-backing on message to check Reminder database
	var now = moment().format("YYYY-MM-DD HH:mm:ss");
	con.connect(err=>{
		if (err) {
			console.log(err);
		}
	});

	// List of reminderIDs to delete from database
	var toDelete = new Array();

	var query = con.query("SELECT * FROM reminders WHERE `new_date` < ?;", [[now]]);

	query.on("error", err => {
		if (err) {
			console.log(err);
		}
	});

	query.on("result", row => {
		var remindText	=	`⌚ You requested a reminder on ${moment(row.origin_date).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")} to remind you:\n`+
							`\`${row.note}\``;
		var remindFoot	=	`This reminder was due ${moment(row.new_date).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")}, and delivered `+
							`${moment(now).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")}. If this was not on time, please message ZedFish#2430.`;
		var colour		= 0x33b23b;
		var embed		= {
			color:			colour,
			description:	remindText,
			footer:			remindFoot
		};
		client.fetchUser(row.userID).createDM("", {embed});
		toDelete.push(row.reminderID);
	});

	query.on("end", () => {
		for (var id of toDelete) {
			con.query(`DELETE FROM remindme WHERE \`reminderID\` = ${id}`);
		}
	});

	con.end();
});

client.on("messageDelete", msg => {
	var guild			= msg.guild;
	var logChannel		= guild.channels.get("412612544436633600");
	var msgAuthor		= msg.author;
	var msgContent		= msg.cleanContent;
	var msgChannel		= msg.channel;
	var msgDateTime		= msg.createdAt;
	var fileString		= "";

	if (msg.attachments.size > 0) {
		fileString += msg.attachments.first().url;
	}

	if (msgAuthor.nickname) {
		var msgAuthorName = msgAuthor.displayName;
	} else {
		var msgAuthorName = msgAuthor.username;
	}

	if (!msgAuthor.bot && msgContent.charAt(0) !== "+") {
		var embed = {
			thumbnail: {
				url: msgAuthor.avatarURL
			},
			color: client.COLOR,
			title: `${msgAuthor.tag} (${msgAuthorName}) in #${msgChannel.name}:`,
			description: msgContent,
			image: {
				url: fileString
			},
			timestamp: new Date()
		}
		logChannel.send("", {embed});
	}
});

client.on("guildMemberAdd", member => {
	var guild			= member.guild;
	var welcomeChannel	= guild.channels.get("387580588850151424");
	
	try {
		var welcomeText =	`<:white_check_mark:364924816261906432> **${member.displayName}**, `+
							`Welcome to r/AFL! Everything Australian Football, now on Discord! To access the main channels, `+
							`you'll need to provide us a link to your reddit profile or your reddit name.\n\n`+
							`This is just to prevent spam, and we require your account is at least two weeks old.`;
		formatMessage.sendWelcome(member, welcomeText, "success", welcomeChannel);
	} catch (e) {
		console.log(`SendWelcome Error:\n`+
					`${e}\n`+
					`Member: ${member.displayName}\n`+
					`Channel: ${welcomeChannel}`);
	}
});

client.on("guildMemberRemove", member => {
	var confirmedRole	= "283573666351022081";
	var guild			= member.guild;
	var welcomeChannel	= guild.channels.get("387580588850151424");
	var offTopicChannel	= guild.channels.get("193359073431912449");
	var chairEmote		= guild.emojis.get("445099687402536960");

	var goodbyeText		=	`<:x:364941928070119424> **${member.displayName}** just retired from **r/AFL**. `+
							`Please celebrate as we chair **${member.displayName}** off.\n`+
							`${chairEmote}`;

	if (member.roles.has(confirmedRole)) {
		try {
			formatMessage.sendWelcome(null, goodbyeText, "error", offTopicChannel);
		} catch (e) {
			console.log(`SendWelcome Error:\n`+
						`${e}\n`+
						`Member: ${member.displayName}\n`+
						`Channel: ${offTopicChannel}`);
		}
	} else {
		try{
			formatMessage.sendWelcome(null, goodbyeText, "error", welcomeChannel);
		} catch (e) {
			console.log(`SendWelcome Error:\n`+
						`${e}\n`+
						`Member: ${member.displayName}\n`+
						`Channel: ${welcomeChannel}`);
		}
	}
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
	var guild           = newMember.guild;
	var offTopicChannel = guild.channels.get("193359073431912449");
	var confirmedRole   = "283573666351022081";

	if (!oldMember.roles.has(confirmedRole) && newMember.roles.has(confirmedRole)) {
		//console.log(`${oldMember.roles}\n\n${newMember.roles}`)
		//formatMessage.sendWelcome(null, `<:white_check_mark:364924816261906432> **${newMember.displayName}**, Welcome to r/AFL! Everything Australian Football, now on Discord!`, "success", offTopicChannel);
	}
});

var mysqlUser	= config.dbuser;
var mysqlPass	= config.dbpass;
var con			= mysql.createConnection({
	host:		"localhost",
	user:		mysqlUser,
	password:	mysqlPass,
	database:	"remindme"
});

client.on('ready', () => {
	console.log(`--------------------------------------------------------`);
	console.log(`Logged in and successfully connected as ${client.user.username}.`);
	console.log(`Invite link: https://discordapp.com/oauth2/authorize?CLIENT_id=${client.user.id}&scope=bot&permissions=268446784`);
	console.log(`--------------------------------------------------------`);
	client.user.setGame("prefix: " + config.prefix);
	client.user.setStatus("online", "");
	loadCommands();
});

client.on('error', (err) => {
	console.log("————— BIG ERROR —————");
	console.log(err);
	console.log("——— END BIG ERROR ———");
});

client.on("disconnected", () => {
	console.log("Disconnected!");
});

client.login(client.TOKEN);