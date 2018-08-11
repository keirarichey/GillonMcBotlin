
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

try {
	var Snoowrap = require("snoowrap");
}
catch (e) {
	console.log("Unable to load Snoowrap: " + e);
	process.exit(1);
}

// Check config files exists
try {
	require.resolve("../config.json");
	require.resolve("../reddit_config.json");
}
catch (e) {
	console.log("Configuration config.json or reddit_config.json missing. Copy config.json.dist to config.json, edit it and re-run the script.");
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

// Load reddit config file
try {
	var redditConfig = require("../reddit_config.json");
}
catch (e) {
	console.log("Unable to parse config file: " + e);
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


var redditOptions = {
	userAgent:		redditConfig.user_agent,
	clientId:		redditConfig.client_id,
	clientSecret:	redditConfig.client_secret,
	username:		redditConfig.username,
	password:		redditConfig.password,
};
var redditAPI = new Snoowrap(redditOptions);

var mysqlUser	= config.dbuser;
var mysqlPass	= config.dbpass;
var con			= mysql.createConnection({
	host:		"localhost",
	user:		mysqlUser,
	password:	mysqlPass,
	database:	"remindme"
});
con.connect(err=>{
	if (err) {
		console.log(err);
	}
});

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
			}
			catch (e) {
				if (client.DETAILED_LOGGING) {
					console.log(`LoadCommand Error:`+
								`\n${e}`+
								`\nCommand File: ${file}\n`);
					errors++;
				}
			}
		}
		console.log(`---${folder.toUpperCase()} COMPLETED---`);
	}
	console.log(`\nErrors: ${errors}`);
	console.log(`===LOADING COMPLETED===\n`);
}

var sendModError = function(msg) {
	var modChannel = msg.guild.channels.get("271391673236455428");
	modChannel.send(`Hey guys, I'm having an issue in #welcome, can somebody take a look? They may have posted their Reddit username in a sentence where I can't reach it.`);
	return;
}

var sendCommandError = function(msg, commandName) {
	var errorEmbedText = `❌ There was an error using this command:\n\`${commandName}\` is not a command.`
	var errorEmbed = {
		color:			client.ERROR_COLOR,
		description:	errorEmbedText
	};
	msg.channel.send({embed: errorEmbed});
}

var allowEntry = function(msg, redditUser) {
	redditAPI.getUser(redditUser).created
	.then(time => {
		var d = new Date();
		var now = d.getTime(); // time in unix epoch milliseconds
		var twoWeeksAgo = now - 12096e5 //magic number: two weeks in ms
		if (time * 1000 <= twoWeeksAgo) {
			confirmUser(msg, redditUser);
		} else {
	    	var newRedditEmbedText = `If you've provided a Reddit account, it's less than two weeks old. ` +
	    							 `The rules of the server require users to have been on reddit for longer than ` +
	    							 `two weeks, and we'll be more than happy to let you in once those two weeks are up, ` +
	    							 `just post your reddit username again when the time comes.\n\nIf there has been a ` +
	    							 `mistake, please @Umpires for help.`;
	    	var newRedditEmbed = {
				color:			client.INFO_COLOR,
				description:	newRedditEmbedText
			};
			msg.channel.send({embed: newRedditEmbed});
		}
	})
	.catch(e => {
		console.log(`Reddit User Error for: ${redditUser}`);
		console.log(e);
    	var noRedditEmbedText = `The reddit account you provided doesn't exist or there was an error checking it. As an extension of r/AFL, we ask` +
    							`that you have a valid reddit account more than two weeks old to participate in the ` +
    							`Discord server.\n\nIf there has been a mistake, please @Umpires for help.`;
    	var noRedditEmbed = {
			color:			client.ERROR_COLOR,
			description:	noRedditEmbedText
		};
		msg.channel.send({embed: noRedditEmbed});
	})
}

var confirmUser = function(msg, redditUser) {
	var userDumpChannel = msg.guild.channels.get("280250705946607618");
	var offTopicChannel = msg.guild.channels.get("193359073431912449");
	var rulesChannel = msg.guild.channels.get("193315916484706305");
	var botChannel = msg.guild.channels.get("253192230200803328");
	var confirmedRole = "283573666351022081";

	msg.member.addRole(confirmedRole)
	.then(discordUser => {
		var welcomeEmbedText = `✅ Welcome, <@${discordUser.id}> to the r/AFL Discord Server! Don't forget to check the ${rulesChannel.toString()}, ` +
							   `and head over to ${botChannel.toString()} to grab a team flair or check match scores!`
		var welcomeEmbed = {
			color:			client.SUCCESS_COLOR,
			description:	welcomeEmbedText
		};
		offTopicChannel.send({embed: welcomeEmbed})
		.then(userDumpChannel.send(`${discordUser.tag} (created ${discordUser.createdAt}) is https://reddit.com/u/${redditUser}`))
		.catch(e => {
			console.log(e);
		})
	})
	.catch(e => {
		console.log(e);
	})
}

var sendReminders = function() {
	var now = moment().format("YYYY-MM-DD HH:mm:ss");
	// List of reminderIDs to delete from database
	var toDelete = new Array();
	var query = con.query("SELECT * FROM reminders WHERE `new_date` < ?;", [[now]]);

	query.on("error", err => {
		if (err) {
			console.log(err);
		}
	});

	query.on("result", row => {
		var remindText =	`⌚ You requested a reminder on ${moment(row.origin_date).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")} to remind you:\n` +
							`\`${row.note}\``;
		var remindFoot =	`This reminder was due ${moment(row.new_date).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")}, and delivered ` +
							`${moment(now).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")}. If this was not on time, please message ZedFish#2430.`;
		var rEmbed = {
			color:			client.COLOR,
			description:	remindText,
			footer:			{text: remindFoot}
		};
		var remindAuthor = client.fetchUser(row.userID)
		.then(user => {
			if (!user.dmChannel) {
				user.createDM()
				.then(channel => {
					channel.send({embed: rEmbed});
				});
			}
			else {
				user.dmChannel.send({embed: rEmbed});
			}
		});
		toDelete.push(row.reminderID);
	});

	query.on("end", () => {
		for (var id of toDelete) {
			con.query('DELETE FROM `reminders` WHERE \`reminderID\` = ?', [[id]]);
		}
	});
}

client.on("message", msg => {
	// Piggy-backing on message to check Reminder database, because I can't otherwise find
	// a way to get the bot to just check this periodically.
	sendReminders();

	// OK, now on to normal message handling:

	// IF a message is sent in the welcome channel, check to see if it's someone providing
	// their reddit username.
	// The while loop is so we can break out of it if there's anything to indicate that this
	// isn't a reddit username message in welcome.
	while (msg.guild) {
		var welcomeChannel = msg.guild.channels.get("387580588850151424");
		var confirmedRole = "283573666351022081";

		var usernameRegex = /(?:https?:\/\/)?(?:www\.)?(?:reddit\.com)?(?:(?:\/?u\/)|(?:\/?user\/))([^\s\.\/]+)/;
		var redditUser = msg.content.match(usernameRegex);

		if (msg.channel !== welcomeChannel) {
			break;
			// Cancel out of the while loop and treat the message as a command
		}

		if (msg.member.roles.has(confirmedRole) || msg.author.bot) {
			return;
			// If they are a mod or a bot and are posting in #welcome, then ignore this message
		}

		if (redditUser) {
			allowEntry(msg, redditUser[1]);
			return;
			// Message has been handled and the message can now be ignored.
		}
		else {
			// Let the mods know ONCE ONLY there's something not going to plan
			msg.channel.search({
				author: msg.author
			})
			.then(res => {
				if (res.totalResults <= 1) {
					sendModError(msg);
				}
				return;
				// Message has been handled and can now be ignored.
			})
		}
	}
	// If we get here, the message must have been not in #welcome, 
	// and if it was, the .on("message") should have been returned by now.

	// Now, if a message isn't send in welcome with a reddit username, then it can only be a command.
	// Let's check to see if it was sent by a user, has a prefix, is valid, and can be used.

	if (!msg.content.startsWith(client.PREFIX) || msg.author.bot) {
		return;
	}

	// Remove prefix from message
	var cont			=	msg.content.slice(client.PREFIX.length).split(/ +/);
	// Grab the word previously attached to the prefix as a command name
	var commandName		=	cont.shift().toLowerCase();
	// ...and use what's left of the message as arguments for the command
	var args			=	cont.join(" ").toLowerCase();

	var command			=	client.COMMANDS.get(commandName)
							|| client.COMMANDS.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) {
    	if (msg.channel.type !== "text") {
    		sendCommandError(msg, commandName);
    	}
    	else {
			var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam
			if (msg.channel === botChannel) {
				sendCommandError(msg, commandName);
			}
    	}
    	return;
    }

	if (command.guildOnly && msg.channel.type !== 'text') {
		msg.reply('I can only run this command inside the r/AFL Discord Server.');
		return;
	}

	if (command.args && !args.length) {
		var errorEmbedText	= `❌ There was an error using this command:\n\`${command.name}\` requires at least one argument.`
		if (command.usage) {
			errorEmbedText += `\nThe correct usage is: \`${client.PREFIX}${command.name} ${command.usage}\``;
			if (command.aliases) {
				errorEmbedText += `\nOther usages allowed are:`
				for (var alias in command.aliases) {
					errorEmbedText += `\n\`${client.PREFIX}${command.aliases[alias]} ${command.usage}\``;
				}
			}
		}
    	var errorEmbed	= {
			color:			client.ERROR_COLOR,
			description:	errorEmbedText
		};
		msg.channel.send({embed: errorEmbed});
		return;
	}

	try {
		command.execute(msg, args);
	} catch (e) {
		if (client.DETAILED_LOGGING) {
			console.log(`RunCommand Error:\n` +
						`${e}\n` +
						`Author: ${msg.author}\n` +
						`Message: ${msg.content}\n`);
		}
	}

	if (client.DELETE_COMMANDS) {
		msg.delete();
	}
});

client.on("messageDelete", msg => {
	var guild			=	msg.guild;
	var logChannel		=	guild.channels.get("412612544436633600");
	var msgAuthor		=	msg.author;
	var msgContent		=	msg.cleanContent;
	var msgChannel		=	msg.channel;
	var msgDateTime		=	msg.createdAt;
	var fileString		=	"";

	if (msg.attachments.size > 0) {
		fileString += msg.attachments.first().url;
	}

	if (msgAuthor.nickname) {
		var msgAuthorName = msgAuthor.displayName;
	}
	else {
		var msgAuthorName = msgAuthor.username;
	}

	if (!msgAuthor.bot && msgContent.charAt(0) !== "+") {
		var deletedMessageEmbed = {
			thumbnail: {
				url: 		msgAuthor.avatarURL
			},
			color:			client.COLOR,
			title:			`${msgAuthor.tag} (${msgAuthorName}) in #${msgChannel.name}:`,
			description:	msgContent,
			image: {
				url: 		fileString
			},
			timestamp: new Date()
		};
		logChannel.send({embed: deletedMessageEmbed});
	}
});

client.on("guildMemberAdd", member => {
	var guild			=	member.guild;
	var welcomeChannel	=	guild.channels.get("387580588850151424");
	var welcomeText 	=	`<:white_check_mark:364924816261906432> **${member.displayName}**, `+
							`Welcome to r/AFL! Everything Australian Football, now on Discord! To access the main channels, `+
							`you'll need to provide us a link to your reddit profile or your reddit name.\n`+
							`To get the system to work, please just type /u/YourUsername (or just u/YourUsername), or post a link.\n\n`+
							`This is just to prevent spam, and we require your account is at least two weeks old.`;
	var joinEmbed		=	{
		color:			client.SUCCESS_COLOR,
		description:	welcomeText
	};

	welcomeChannel.send(`<@${member.id}>`, {embed: joinEmbed})
	.catch(e => {
		console.log(`SendWelcome Error:\n`+
					`${e}\n`+
					`Member: ${member.displayName}\n`+
					`Channel: ${welcomeChannel.name}\n`);
	});
});

client.on("guildMemberRemove", member => {
	var confirmedRole	=	"283573666351022081";
	var guild			=	member.guild;
	var welcomeChannel	=	guild.channels.get("387580588850151424");
	var offTopicChannel	=	guild.channels.get("193359073431912449");
	var chairEmote		=	guild.emojis.get("445099687402536960");

	var goodbyeText		=	`<:x:364941928070119424> **${member.displayName}** just retired from **r/AFL**. `+
							`Please celebrate as we chair **${member.displayName}** off.`
							//`\<:chair:445099687402536960>`;

	var leaveEmbed		= {
		color:			client.ERROR_COLOR,
		description:	goodbyeText
	};

	if (member.roles.has(confirmedRole)) {
		offTopicChannel.send({embed: leaveEmbed})
		.then(sentMsg => {
			sentMsg.react(chairEmote);
		})
		.catch(e => {
			console.log(`SendWelcome Error:\n`+
						`${e}\n`+
						`Member: ${member.displayName}\n`+
						`Channel: ${offTopicChannel.name}\n`);
		});
	}
	else {
		welcomeChannel.send({embed: leaveEmbed})
		.then(sentMsg => {
			sentMsg.react(chairEmote);
		})
		.catch(e => {
			console.log(`SendWelcome Error:\n`+
						`${e}\n`+
						`Member: ${member.displayName}\n`+
						`Channel: ${welcomeChannel.name}\n`);
		});
	}
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
	var guild           = newMember.guild;
	var offTopicChannel = guild.channels.get("193359073431912449");
	var confirmedRole   = "283573666351022081";

	if (!oldMember.roles.has(confirmedRole) && newMember.roles.has(confirmedRole)) {
		//console.log(`${oldMember.roles}\n\n${newMember.roles}`)
	}
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