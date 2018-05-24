module.exports = {

	color:			0x345b95, // blue
	successColor:	0x33b23b, // green
	errorColor:		0xe24540, // red
	infoColor:		0xe2a640, // yellow

	/*  Creates a message template to use in case of success,
	 *  failure, or requiring info about the bot. Because it
	 *  is a Discord embed, we can use colours and pictures.
	 *
	 *  @param {string} info
	 *  @param {string} type
	 *  @param {Message} msg
	 */
	sendNotification: function(info, type, msg) {
		var icolor;

		if (type === "success") {
			icolor = this.successColor;
		} else if (type === "error") {
			icolor = this.errorColor;
		} else if (type === "info") {
			icolor = this.infoColor;
		} else {
			icolor = this.color;
		}

		var embed = {
			color: icolor,
			description: info
		};
		msg.channel.send("", {embed});
	},
	sendWelcome: function(user, info, type, channel) {
		var icolor;

		if (type === "success") {
			icolor = this.successColor;
		} else if (type === "error") {
			icolor = this.errorColor;
		} else if (type === "info") {
			icolor = this.infoColor;
		} else {
			icolor = this.COLOR;
		}

		var embed = {
			color: icolor,
			description: info
		};
		if (user !== null){
			channel.send(`<@${user.id}>`, {embed});
		} else {
			channel.send("", {embed});
		}
	}
}