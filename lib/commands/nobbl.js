var loadError = false;

// Import yaml
try {
	var yaml = require("yamljs");
}
catch (e) {
	console.log("yamljs missing. Run `npm install` first.");
	loadError = true;
}

// Import GilMcBotlin data
try {
	var bblTeams		= yaml.load("../data/bbl.yml");
	var bblTeamNames	= yaml.load("../data/bblnames.yml");
}
catch (e) {
	console.log("Could not load bbl.yml, and/or bblnames.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
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
	name:		"nobbl",
	args:		false,
	help:		"Remove all BBL team flairs. For those who *don't like cricket, oh no*.",
	aliases:	["uncricket", "nocricket", "unbbl"],
	hide:		false,
	guildOnly:	true,
	inputs:		null,

	execute: (msg, args) => {
		checkLoad(msg);
		
		var botChannel		= msg.guild.channels.get("253192230200803328"); //bot_spam

		if (msg.channel !== botChannel) {
			return;
		}

		var guild			= msg.guild;
		var confirmed_role	= "283573666351022081";

		var member			= msg.member;
		var drop_array		= [];
		var member_roles	= member.roles.array();
		/*  Adds the confirmed role, just to make sure that
		 *  we don't accidentally kick anyone from the server
		 *  for not being Confirmed. It's assumed that if they
		 *  can use this command, they must already be allowed
		 *  in the server.
		 */
		if (!member.roles.has(confirmed_role)) {
			member_roles.push(guild.roles.find("name", "Confirmed"));
		}
		/*  We take every role in the user's existing roles,
		 *  and if it is contained in bbl.yml, we add it
		 *  to our array of roles we wish to remove.
		 *  We also grab the name for logging purposes.
		 *  Also note to check if it's the premier team.
		 */
		member.roles.array().forEach(function(role) {
			if (Object.keys(bblTeams).includes(role.name) || Object.keys(bblTeams).includes(role.name.split("🏆").join("").trim())) {
				drop_array.push(role);
			}
		});

		member.removeRoles(drop_array);

		var nobblText	= `🚫 🏏 <@${member.id}> is no longer a fan of any BBL team! That's just not cricket.`;
		var nobblEmbed	=	{
			color:			0x33b23b, // green
			description:	nobblText
		};
		msg.channel.send({embed: nobblEmbed});
	}
}