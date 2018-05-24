module.exports = {
	name:		"noteam",
	args:		false,
	help:		"Remove all team flairs. Use +noteam. For the neutral supporter in all of us.",
	hide:		false,
	guildOnly:	true,

	execute: (msg, args) => {

		var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam

		if (msg.channel !== botChannel) {
			return;
		}

		var error = false;

		// Import YAML
		try {
			var yaml = require("yamljs");
		} catch (e) {
			console.log("yamljs missing. Run `npm install` first.");
			error = true;
		}

	   // Import GilMcBotlin data
		try {
			var teams			= yaml.load("../data/teams.yml");
			var team_names	= yaml.load("../data/teamnames.yml");
			var team_emotes	= yaml.load("../data/teamemotes.yml");
		} catch (e) {
			console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the GillonMcBotlin/data/ directory and are valid YML.");
			error = true;
		}

		// Load message format methods
		try {
			var formatMessage = require('../formatmessage.js');
		} catch (e) {
			console.log("Unable to load message formatting methods:\n" + e);
			error = true;
		}

		if (error) {
			try {
				formatMessage.sendNotification("There was an error loading this command.", "error", msg);
				return;
			} catch (e) {
				msg.reply("There was an error loading this command.", "error", msg);
				return;
			}
		}


		var server = msg.guild;
		var confirmed_role = "283573666351022081";

		var user = msg.member;
		var drop_array = [];
		var user_roles = user.roles.array();
		/*  Adds the confirmed role, just to make sure that
		 *  we don't accidentally kick anyone from the server
		 *  for not being Confirmed. It's assumed that if they
		 *  can use this command, they must already be allowed
		 *  in the server.
		 */
		if (!user.roles.has(confirmed_role)) {
			user_roles.push(server.roles.find("name", "Confirmed"));
		}
		/*  We take every role in the user's existing roles,
		 *  and if it is contained in teams.yml, we add it
		 *  to our array of roles we wish to remove.
		 *  We also grab the name for logging purposes.
		 *  Also note to check if it's the premier team.
		 */
		user.roles.array().forEach(function(role) {
			if (Object.keys(teams).includes(role.name) || Object.keys(teams).includes(role.name.split("🏆").join("").trim())) {
				drop_array.push(role);
			}
		});

		/*  First, we take every role to drop_array, then
		 *  remove it from the user_roles array.
		 */
		drop_array.forEach(function(role) {
			var index = user_roles.indexOf(role);
			if (index > -1) {
				user_roles.splice(index, 1);
			}
		});

		/*  And then  we edit the user's roles with our
		 *  new role array.
		 */
		//user.setRoles(user_roles);

		user.removeRoles(drop_array);
		// console.log(`Removed ${drop_array_names} from ${user.displayName}.`)
		var noteamText = `<:no_entry_sign:364917720212439041> ${user.displayName} is no longer a fan of any team!`;
		formatMessage.sendNotification(noteamText, "success", msg);
	}
}
