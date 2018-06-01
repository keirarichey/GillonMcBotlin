var error = false;

// Import yaml
try {
	var yaml = require("yamljs");
}
catch (e) {
	console.log("yamljs missing. Run `npm install` first.");
	error = true;
}

// Import GilMcBotlin data
try {
	var groups		= yaml.load("../data/groups.yml");
	var group_names	= yaml.load("../data/groupnames.yml");
}
catch (e) {
	console.log("Could not load groups.yml and/or groupnames.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
	error = true;
}

// Load message format methods
try {
	var formatMessage = require('../formatmessage.js');
}
catch (e) {
	console.log("Unable to load message formatting methods:\n" + e);
	error = true;
}

if (error) {
	try {
		formatMessage.sendNotification("There was an error loading this command.", "error", msg);
		return;
	}
	catch (e) {
		msg.reply("There was an error loading this command.", "error", msg);
		return;
	}
}

module.exports = {
	name:		"ungroup",
	args:		true,
	help:		"Remove a gaming group. Use +ungroup `group name`.",
	usage: 		"<group>",
	aliases:	["leavegroup"],
	hide:		false,
	guildOnly:	true,

	execute: (msg, args) => {

		var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam

		if (msg.channel !== botChannel) {
			return;
		}

		var server = msg.guild;

		var user = msg.member;
		if (!Object.values(group_names).includes(args)) {
			/* If the request group is not a real group (not in groups array) */
			/* The user didn't input a real group, so we will inform them it failured */
			var errorText =	`${user.displayName}: \<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! \`${args}\` is not an accepted input!\n`+
							`Please use "+help" for help.`;
			formatMessage.sendNotification(errorText, "error", msg);
			return;
		}
		else {
			var role_name;
			var to_remove;
			var user_roles = Array.from(user.roles.values());

			/*  We look into our groups.yml file and find out
			 *  which group corresponds to our argument string.
			 */
			Array.from(Object.keys(groups)).forEach(function(group_name) {
				if (groups[group_name].includes(args)) {
						role_name = group_name;
				}
				else {
					return;
				}
			});

			Array.from(server.roles.values()).forEach(function(role) {
				if (role.name == role_name) {
					to_remove = role;
				}
				else {
					return;
				}
			});

			if (user.roles.has(to_remove.id)) {
				/*  Then, we remove our role from our user_roles
				 *  array.
				 */
				var index = user_roles.indexOf(to_remove);
				if (index > -1) {
					user_roles.splice(index, 1);
				}

				/*  And then finally, we edit the user's roles with
				 *  our new role array.
				 */
				user.setRoles(user_roles);
	
				// console.log(`@${user.displayName} is no longer a part of the ${to_remove.name} group!`)
				var nogroupText = `<:negative_squared_cross_mark:364924937867231242> <@${user.id}> is no longer a part of the ${to_remove.name} group!`;
				formatMessage.sendNotification(nogroupText, "success", msg);
			}
			else {
				var hasText = `<:thinking:364915444194344986> ${user.displayName}: You're not a part of the ${to_remove.name} group, so you cannot be removed from it.`;
				formatMessage.sendNotification(hasText, "info", msg);
			}
		}
	}
}
