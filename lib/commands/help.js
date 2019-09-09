var loadError = false;

// Load config file
try {
    var config = require("../../config.json");
} catch (e) {
    console.log("Unable to parse config file: " + e);
    error = true;
}

var checkLoad = function (msg) {
    if (loadError) {
        var loadErrorEmbed = {
            color: 0xe24540, // red
            description: "There was an error loading this command."
        };
        msg.channel.send({
                embed: loadErrorEmbed
            })
            .catch(e => {
                console.log(`LoadCommand Error:\n` +
                    `${e}\n` +
                    `Member: ${msg.author.displayName}\n` +
                    `Channel: ${msg.channel.name}\n`);
            });
        return;
    }
}

module.exports = {
    name: 'help',
    help: `List all of Gil's commands or get info about a specific command.`,
    usage: '<command name>',
    aliases: ['commands'],
    hide: true,
    guildOnly: false,
    execute(msg, args) {
        return;
        // ...
        // PUT IN AN IF ON ARGS:
        // IF NO ARGS, GIVE A LIST OF COMMANDS
        // IF ARG GIVEN, RETURN DETAILED HELP FOR ONE COMMAND

    },
};