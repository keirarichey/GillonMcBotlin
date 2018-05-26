
module.exports = {
    name:		'help',
    help:		`List all of Gil's commands or get info about a specific command.`,
    usage:		'<command name>',
    aliases:	['commands'],
    hide:		false,
    guildOnly:	false,
    execute(msg, args) {
        // ...
        // PUT IN AN IF ON ARGS:
        // IF NO ARGS, GIVE A LIST OF COMMANDS
        // IF ARG GIVEN, RETURN DETAILED HELP FOR ONE COMMAND
        var error = false;

		// Load config file
		try {
			var config = require("../../config.json");
		} catch (e) {
			console.log("Unable to parse config file: " + e);
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

		var prefix = config.prefix;
    },
};