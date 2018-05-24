module.exports = {
	name:		"unmute",
	args:		true,
	help:		"Moderator command. Unmutes a selected user.",
	usage: 		"<userMention>",
	hide:		true,
	guildOnly:	true,

	execute: (msg, args) => {

		// Load message format methods
		try {
			var formatMessage = require('../formatmessage.js');
		} catch (e) {
			console.log("Unable to load message formatting methods:\n" + e);
			msg.reply("There was an error loading this command.", "error", msg);
		}
	
		var server = msg.guild;
		var modRole = "193317014964666368"; // Umpires role
		var user = msg.member;
		var target = msg.mentions.members.first();

		if (!user.roles.has(modRole)) {
			var permissionText = `\<:gil:411107473907515392> You do not have permission to use that command. You must have the Umpires role to use this command.`;
			formatMessage.sendNotification(permissionText, "error", msg);
		} else {
			var channelIDs = ["271391673236455428", "280250705946607618", "387580588850151424", "193315916484706305"];
			var textChannels = server.channels.filterArray(c => c.type == "text" && !(channelIDs.includes(c.id)));
			textChannels.forEach(function(channel) {
				channel.overwritePermissions(target, {
					SEND_MESSAGES: true
				})
			});
			target.setMute(false);
			var unmuteText = `\<:open_mouth:402327706366115840> ${target.displayName} has been unmuted by ${user.displayName}.`;
			formatMessage.sendNotification(unmuteText, "success", msg);
		}
	}
}