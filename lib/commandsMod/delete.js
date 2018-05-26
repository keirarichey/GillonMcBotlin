module.exports = {
	name:		"delete",
	args:		true,
	help:		"Moderator command. Deletes a specified number of messages.",
	usage: 		"<number of messages>",
	hide:		true,
	guildOnly:	true,

	execute: async (msg, args) => {

		// Load message format methods
		try {
			var formatMessage = require('../formatmessage.js');
		} catch (e) {
			console.log("Unable to load message formatting methods:\n" + e);
			msg.reply("There was an error loading this command.", "error", msg);
		}
	
		var server	= msg.guild;
		var modRole	= "193317014964666368"; // Umpires role
		var user		= msg.member;
		var quant		= parseInt(args);

		if (!user.roles.has(modRole)) {
			var permissionText = `\<:gil:411107473907515392> You do not have permission to use that command. You must have the Umpires role to use this command.`;
			formatMessage.sendNotification(permissionText, "error", msg);
		} else {
			try {
				var fetched = await msg.channel.fetchMessages({limit: quant + 1});
				msg.channel.bulkDelete(fetched);
			} catch (e) {
				console.log(e);
			}
			var removeText = `❌ ${quant} messages have been removed by ${user.displayName}.`;
			formatMessage.sendNotification(removeText, "success", msg);
		}
	}
}