module.exports = {
	name:		"group",
	args:		true,
	help:		"Add a gaming group to play games, including Overwatch, CS:GO, Age of Empires 2, and PUBG. Use +group `group name`.",
	usage: 		"<group>",
	aliases:	["game", "gaming"],
	hide:		false,
	guildOnly:	true,

	execute: (msg, args) => {
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
			var group		= yaml.load("../data/groups.yml");
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

		var botChannel		= msg.guild.channels.get("253192230200803328"); //bot_spam

		if (msg.channel !== botChannel) {
			return;
		}

		var server	= msg.guild;
		var user		= msg.member;

		if (!Object.values(group_names).includes(args)) {
			/* If the request group is not a real group (not in groups array) */
			/* The user didn't input a real group, so we will inform them it failured */
			var errorText = `${user.displayName}: \<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! \`${args}\` is not an accepted input!\n`+
							`Please use "+help" for help.`;
			formatMessage.sendNotification(errorText, "error", msg);
			return;
		}
		else {
			var to_add;
			var new_group;
			var user_roles = Array.from(user.roles.values());

			/*  We look into our groups.yml file and find out
			 *  which group corresponds to our argument string.
			 */
			Array.from(Object.keys(groups)).forEach(function(group_name) {
				if (groups[group_name].includes(args)) {
						new_group = group_name;
				}
				else {
					return;
				}
			});

			/*  Given new_group is now styled in the way the
			 *  server's roles are named, we look up in the
			 *  server's roles which role is the one we want.
			 */
			Array.from(server.roles.values()).forEach(function(role) {
				if (role.name == new_group) {
					to_add = role;
				}
				else {
					return;
				}
			});

			if (user.roles.has(to_add.id)) {
				var hasText = `<:thinking:364915444194344986> <@${user.id}>: You're already part of the ${to_add.name} group, so you cannot be added to it.`;
				formatMessage.sendNotification(hasText, "info", msg);
			}
			else {
				// We add our new role to our user_roles array.
				user_roles.push(to_add);
	
				/*  And then finally, we edit the user's roles with
				 *  our new role array.
				 */
				user.setRoles(user_roles);
	
				// console.log(`@${user.displayName} is now a part of the ${to_add.name} group!`)
				var successText = `<:white_check_mark:364924816261906432> ${user.displayName} is now a part of the ${to_add.name} group!`;
				formatMessage.sendNotification(successText, "success", msg);
			}
		}
	}
}
