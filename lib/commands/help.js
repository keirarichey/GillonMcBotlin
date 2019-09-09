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

var helpError = function (msg, args) {
    var errorEmbedText = `❌ There was an error getting help for that command:\n\`${args}\` is not a command.`
    var errorEmbed = {
        color: client.ERROR_COLOR,
        description: errorEmbedText
    };
    msg.channel.send({
        embed: errorEmbed
    });
}

module.exports = {
    name: 'help',
    help: `List all of Gil's commands or get info about a specific command.`,
    usage: '<command name>',
    aliases: ['commands'],
    hide: true,
    guildOnly: false,
    modOnly: false,
    botChannelOnly: true,
    execute(msg, args, client) {
        if (args) {
            var command;
            var embedFields = [];
            if (!client.COMMANDS.get(args)) {
                if (client.COMMANDS.find(cmd => cmd.aliases && cmd.aliases.includes(args))) {
                    // If args are passed, and they are a command's alias, then it's all gravy baby
                    command = client.COMMANDS.find(cmd => cmd.aliases && cmd.aliases.includes(args));
                } else {
                    // Otherwise, args passed but they aren't a command or it's alias? That's a paddlin'.
                    helpError(msg, args);
                    return;
                }
            } else {
                // If the passed args IS the name of the command, then get it.
                command = client.COMMANDS.get(args);
            }
        
            if (!command.args) {
                var helpString = `${command.help}\n\n Type \`${client.PREFIX}${command.name}\` ` +
                    `to use this command.`;
            } else {
                var helpString = `${command.help}\n\n Type \`${client.PREFIX}${command.name} ${command.usage}\` ` +
                    `to use this command.`;
            }
        
            if (command.aliases) {
                helpString += `\n The other ways to use ${client.PREFIX}${command.name} are:`;
                for (var alias in command.aliases) {
                    if (!command.usage) {
                        helpString += `\n\`${client.PREFIX}${command.aliases[alias]}\``;
                    } else {
                        helpString += `\n\`${client.PREFIX}${command.aliases[alias]} ${command.usage}\``;
                    }
                }
            }
        
            if (command.inputs) {
                helpString += `\n\nThe arguments allowed for this command are:\n`;
                //helpString += `\n\`${command.inputs.join("` | `")}\``;
                for (var role in command.inputs) {
                    if (command.inputs.hasOwnProperty(role)) {
                        var roleEmote = "";
                        for (var team in teamEmotes) {
                            if (team === role) {
                                roleEmote = teamEmotes[team];
                                roleEmote += " ";
                            }
                        }
        
                        var helpField = {
                            name: roleEmote + role,
                            value: `\`${command.inputs[role].join("` | `")}\``,
                            inline: false
                        };
                        embedFields.push(helpField)
                    }
                }
            }
        
            var helpEmbed = {
                color: client.COLOR,
                author: {
                    name: `Gil McBotlin Help`,
                    icon_url: client.user.avatarURL
                },
                title: "HELP WITH " + command.name.toUpperCase(),
                description: helpString,
                fields: embedFields,
                footer: {
                    text: `For help with other commands, type \`+help <command>\`. If you'd like to make any suggestions, please contact ZedFish.`
                }
            }
            msg.channel.send({
                    embed: helpEmbed
                })
                .catch(e => {
                    console.log(
                        `help Error:\n` +
                        `${e}\n` +
                        `Member: ${msg.member.displayName}\n` +
                        `Channel: ${msg.channel.name}\n`
                    );
                });
        } else {
            var embedFields = [];
            client.COMMANDS.forEach((value, key, map) => {
                if (value.hide) {
                    return;
                }
        
                if (!value.args) {
                    var helpString = `${value.help}\n Type \`${client.PREFIX}${value.name}\` ` +
                        `to use this command.`;
                } else {
                    var helpString = `${value.help}\n Type \`${client.PREFIX}${value.name} ${value.usage}\` ` +
                        `to use this command.`;
                }
                if (value.aliases) {
                    helpString += `\n The other ways to use ${client.PREFIX}${value.name} are:`;
                    for (var alias in value.aliases) {
                        if (!value.usage) {
                            helpString += `\n\`${client.PREFIX}${value.aliases[alias]}\``;
                        } else {
                            helpString += `\n\`${client.PREFIX}${value.aliases[alias]} ${value.usage}\``;
                        }
                    }
                }
        
                var helpField = {
                    name: value.name,
                    value: helpString,
                    inline: false
                };
                embedFields.push(helpField);
            });
            var helpEmbed = {
                color: client.COLOR,
                author: {
                    name: "Gil McBotlin Help",
                    icon_url: client.user.avatarURL
                },
                fields: embedFields,
                footer: {
                    text: "For further help, please type `+help <command>`. If you'd like to make any suggestions, please contact ZedFish."
                }
            }
            msg.channel.send({
                    embed: helpEmbed
                })
                .catch(e => {
                    console.log(
                        `help Error:\n` +
                        `${e}\n` +
                        `Member: ${msg.member.displayName}\n` +
                        `Channel: ${msg.channel.name}\n`
                    );
                });
        }
        
    },
};