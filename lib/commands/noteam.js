module.exports = {
	main: (bot, msg) => {
		const bot_channel = msg.guild.find("id", "253192230200803328");

		if (msg.channel == bot_channel) {
			// Import yaml
			try {
				var yaml = require("yamljs");
			} catch (e) {
				console.log("yamljs missing. Run `npm install` first.");
				process.exit();
			}
	
			// Import GilMcBotlin data
			try {
				var teams = yaml.load("../data/teams.yml");
				var team_names = yaml.load("../data/teamnames.yml");
				var team_emotes = yaml.load("../data/teamemotes.yml");
			} catch (e) {
				console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
				process.exit();
			}
	
			const SERVER = msg.guild;
			var confirmed_role = "283573666351022081";
	
			var user = msg.member;
			var drop_array = [];
			var user_roles = Array.from(user.roles.values());
			/*	Adds the confirmed role, just to make sure that
			 *	we don't accidentally kick anyone from the server
			 *	for not being Confirmed. It's assumed that if they
			 *	can use this command, they must already be allowed
			 *	in the server.
			 */
			if (!user.roles.has(confirmed_role)) {
				user_roles.push(SERVER.roles.find("name", "Confirmed"));
			}
			/*	We take every role in the user's existing roles,
			 *	and if it is contained in teams.yml, we add it
			 *	to our array of roles we wish to remove.
			 *	We also grab the name for logging purposes.
			 *	Also note to check if it's the premier team.
			 */
			Array.from(user.roles.values()).forEach(function(role) {
				if (Object.keys(teams).includes(role.name) || Object.keys(teams).includes(role.name.split("🏆").join("").trim())) {
					drop_array.push(role);
				}
			});
	
			/*	First, we take every role to drop_array, then
			 *	remove it from the user_roles array.
			 */
			drop_array.forEach(function(role) {
				var index = user_roles.indexOf(role);
				if (index > -1) {
					user_roles.splice(index, 1);
				}
			});
	
			/*	And then  we edit the user's roles with our
			 *	new role array.
			 */
			user.setRoles(user_roles);
			console.log(`Removed all teams from ${user.displayName}.`)
			bot.sendNotification(`<:no_entry_sign:364917720212439041> <@${user.id}> is no longer a fan of any team!`, "success", msg);
		} else {
			return;
		}
	},
	args: "",
	help: "Remove all team flairs. Use +noteam. For the neutral supporter in all of us.",
	hide: false
}