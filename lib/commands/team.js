module.exports = {
	main: (bot, msg) => {
		// Import yaml
		try {
			var yaml = require("yamljs");
		} catch (e) {
			console.log("yamljs missing. Run `npm install` first.");
			process.exit();
		}

		// Import GilMcBotlin data
		try {
			var teams = yaml.load("../data/teams.yml")
			var teamnames = yaml.load("../data/teamnames.yml")
		} catch (e) {
			console.log("Could not load teams.yml or teamnames.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
			process.exit();
		}

		function checkRoles(guildMember, teamArgument) {
			var teamRole;
			var hasRole = false;
			Array.from(Object.keys(teams)).forEach(function(team_name) {
				if (teams[team_name].includes(teamArgument)) {
						teamRole = team_name;
				} else {
					return;
				}
			});
			Array.from(guildMember.roles.values()).forEach(function(role) {
				if (role.name == teamRole) {
					hasRole = true;
				}
			});
			return hasRole;
		}

		const SERVER = msg.guild;

		var user = msg.member;
		if (!Object.values(teamnames).includes(msg.content)) {
			/* If the request team is not a real team (not in teams array) */
			/* The user didn't input a real team, so we will inform them it failured */
			msg.channel.send(`<@${user.id}>: \<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! \`${msg.content}\` is not an accepted input!`);
			return;
		} else if (checkRoles(user, msg.content)) {
			msg.channel.send(`<@${user.id}>: You already have that role.`);
		} else {
			var drop_array = [];
			var drop_array_names = [];
			/*
			 * Time to find all existing teams roles to remove, and add them to a list of roles to remove.
			 * We'll take the name, too, for admin purposes.
			 */
			Array.from(user.roles.values()).forEach(function(role) {
				if (Object.keys(teams).includes(role.name)) {
					drop_array.push(role);
					drop_array_names.push(role.name);
				}
			});
			/* Insert logging here */

			/*
			 * Now we look up the role we need to add.
			 */
			/* Search the teams array for our team nickname */
			var newteam;
			Array.from(Object.keys(teams)).forEach(function(team_name) {
				if (teams[team_name].includes(msg.content)) { /* If the array of nicknames includes our nickname */
						newteam = team_name;
				} else {
					return;
				}
			});

			function removeRoles(user, roles, reason) {
  				const allRoles = user._roles.slice();
  				if (roles instanceof Collection) {
  				      for (const role of roles.values()) {
  				        const index = allRoles.indexOf(role.id);
  				        if (index >= 0) allRoles.splice(index, 1);
  				    }
  				} else {
  				    for (const role of roles) {
  				        const index = allRoles.indexOf(role instanceof Role ? role.id : role);
  				        if (index >= 0) allRoles.splice(index, 1);
  				    }
  				}
  			return user.edit({ roles: allRoles }, reason);
  			}

			var to_add;
			Array.from(SERVER.roles.values()).forEach(function(role) {
				if (role.name == newteam || role.name == "🏆 "+newteam+" 🏆") {
					to_add = role;
				} else {
					return;
				}
			}); /* Search server roles for proper team ID */
			/* Change team, etc. */
			/* Remove roles using drop array, and log for admin purposes */
			removeRoles(user, drop_array).then(user.addRoles(to_add));
			console.log(`Removed ${drop_array_names} from ${user.displayName}.`)
			msg.channel.send(`<@${user.id}> is now a fan of ${to_add.name}!`);
		}
	},
	args: "<string>",
	help: "sample help text",
	hide: false
}