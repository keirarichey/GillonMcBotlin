var loadError = false;

// Import YAML
try {
	var yaml = require("yamljs");
}
catch (e) {
	console.log("yamljs missing. Run `npm install` first.");
	loadError = true;
}

// Import GilMcBotlin data
try {
	var teams		= yaml.load("../data/teams.yml");
	var teamNames	= yaml.load("../data/teamnames.yml");
	var teamEmotes	= yaml.load("../data/teamemotes.yml");
}
catch (e) {
	console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the GillonMcBotlin/data/ directory and are valid YML.");
	loadError = true;
}

var checkLoad = function(msg) {
	if (loadError) {
		var loadErrorEmbed = {
			color:			0xe24540, // red
			description:	"There was an error loading this command."
		};
		msg.channel.send({embed: loadErrorEmbed})
		.catch(e => {
			console.log(`LoadCommand Error:\n`+
						`${e}\n`+
						`Member: ${msg.author.displayName}\n`+
						`Channel: ${msg.channel.name}\n`);
		});
		return;
	}
}

module.exports = {
	name:		"team",
	args:		true,
	help:		"Add a team flair.",
	usage: 		"<team>",
	aliases:	["aflteam"],
	hide:		false,
	guildOnly:	true,
	inputs:		teams,

	execute: (msg, args) => {
		checkLoad(msg);

		var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam

		if (msg.channel !== botChannel) {
			return;
		}

		var guild			= msg.guild;
		var confirmedRole	= "283573666351022081";

		var member = msg.member;
		if (!Object.values(teamNames).includes(args)) {
			/* If the request team is not a real team (not in teams array) */
			/* The user didn't input a real team, so we will inform them it failured */
			var btEmote		=	guild.emojis.get("246541254182174720");
			var errorText	=	`${btEmote} THAT WAS OUT OF BOUNDS! <@${member.id}>: \`${args}\` is not an accepted input!\n`+
								`Refer to the following for help.\n`;

			errorText += `\nThe correct usage is: \`+${module.exports.name} ${module.exports.usage}\``;
			if (module.exports.aliases) {
				errorText += `\nOther usages allowed are:`
				for (var alias in module.exports.aliases) {
					errorText += `\n\`+${module.exports.aliases[alias]} ${module.exports.usage}\``;
				}
			}

			var errorEmbed	=	{
				color:			0xe24540, // red
				description:	errorText
			};
			msg.channel.send({embed: errorEmbed});
			return;
		}
		else {
			var dropArray		= [];
			var dropArrayNames	= [];
			var toAdd;
			var newTeam;
			var newTeamEmote;
			var memberRoles		= Array.from(member.roles.values());

			/*  Adds the confirmed role, just to make sure that
			 *  we don't accidentally kick anyone from the server
			 *  for not being Confirmed. It's assumed that if they
			 *  can use this command, they must already be allowed
			 *  in the server.
			 */
			if (!member.roles.has(confirmedRole)) {
				memberRoles.push(guild.roles.find("name", "Confirmed"));
			}

			/*  We take every role in the user's existing roles,
			 *  and if it is contained in teams.yml, we add it
			 *  to our array of roles we wish to remove.
			 *  We also grab the name for logging purposes.
			 *  Also note to check if it's the premier team.
			 */
			Array.from(member.roles.values()).forEach(function(role) {
				if (Object.keys(teams).includes(role.name) || Object.keys(teams).includes(role.name.split("🏆").join("").trim())) {
					dropArray.push(role);
					dropArrayNames.push(role.name);
				}
			});

			/*  We look into our teams.yml file and find out
			 *  which team corresponds to our argument string.
			 */
			Array.from(Object.keys(teams)).forEach(function(teamName) {
				if (teams[teamName].includes(args)) {
						newTeam = teamName;
				}
				else {
					return;
				}
			});

			Array.from(Object.keys(teamEmotes)).forEach(function(team) {
				if (newTeam == team) {
					newTeamEmote = teamEmotes[team];
				}
			});

			/*  Given newTeam is now styled in the way the
			 *  server's roles are named, we look up in the
			 *  server's roles which role is the one we want.
			 *  Note, the role may have cups to indicate the
			 *  premier team.
			 */
			Array.from(guild.roles.values()).forEach(function(role) {
				if (role.name == newTeam || role.name == "🏆 " + newTeam + " 🏆") {
					toAdd = role;
				}
				else {
					return;
				}
			});

			/*  First, we take every role to dropArray, then
			 *  remove it from the memberRoles array.
			 */
			dropArray.forEach(function(role) {
				var index = memberRoles.indexOf(role);
				if (index > -1) {
					memberRoles.splice(index, 1);
				}
			});

			if (member.roles.has(toAdd.id)) {
				var inTeamText	=	`🤔 <@${member.id}>: You're already a fan of ${newTeamEmote}${toAdd.name}.`;
				var inTeamEmbed	=	{
					color:			0xe2a640, // yellow
					description:	inTeamText
				};
				msg.channel.send({embed: inTeamEmbed});
			}
			else {

				/*  Then, we add our new role to our memberRoles
				 *  array.
				 */
				memberRoles.push(toAdd);
	
				/*  And then finally, we edit the user's roles with
				 *  our new role array.
				 */
				member.setRoles(memberRoles);
	
				var teamText	=	`${newTeamEmote} <@${member.id}> is now a fan of ${toAdd.name}!`;
				var teamEmbed	=	{
					color:			0x33b23b, // green
					description:	teamText
				};
				msg.channel.send({embed: teamEmbed});
			}
		}
	}
}
