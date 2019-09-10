// Import yaml
var yaml = require("yamljs");

// Import GilMcBotlin data
try {
    var groups = yaml.load("../data/groups.yml");
    var groupNames = yaml.load("../data/groupnames.yml");
} catch (e) {
    console.log("Could not load groups.yml and/or groupnames.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
}

module.exports = {
    name: "ungroup",
    args: true,
    help: "Remove a gaming group.",
    usage: "<group>",
    aliases: ["leavegroup", "removegame", "ungame"],
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: groups,
    execute: (msg, args, client) => {
        var guild = msg.guild;
        var member = msg.member;

        if (!Object.values(groupNames).includes(args)) {
            /* If the request group is not a real group (not in groups array) */
            /* The user didn't input a real group, so we will inform them it failured */
            var errorText = `🚫 🎮 CLEARLY NOT A GADGET-TYPE OPERATOR! <@${member.id}>: \`${args}\` is not an accepted input!\n` +
                `Consult a computer boffin or a real nerd for help.`;
            errorText += `\nThe correct usage is: \`+${module.exports.name} ${module.exports.usage}\``;
            if (module.exports.aliases) {
                errorText += `\nOther usages allowed are:`
                for (var alias in module.exports.aliases) {
                    errorText += `\n\`+${module.exports.aliases[alias]} ${module.exports.usage}\``;
                }
            }
            msg.channel.send({
                embed: {
                    color: client.ERROR_COLOUR,
                    description: errorText
                }
            });
            return;
        } else {
            var roleName;
            var toRemove;

            /*  We look into our groups.yml file and find out
             *  which group corresponds to our argument string.
             */
            Array.from(Object.keys(groups)).forEach(function (groupName) {
                if (groups[groupName].includes(args)) {
                    roleName = groupName;
                }
            });

            Array.from(guild.roles.values()).forEach(function (role) {
                if (role.name == roleName) {
                    toRemove = role;
                }
            });

            if (member.roles.has(toRemove.id)) {
                var dropArray = [];
                dropArray.push(toRemove);
                member.removeRoles(dropArray);

                // console.log(`@${user.displayName} is no longer a part of the ${toRemove.name} group!`)
                var noGroupText = `❎ <@${member.id}> is no longer a part of the ${toRemove.name} group!`;
                msg.channel.send({
                    embed: {
                        color: client.SUCCESS_COLOUR,
                        description: noGroupText
                    }
                });
            } else {
                var notInGroupText = `🤔 <@${member.id}>: You're not a part of the ${toRemove.name} group, so you cannot be removed from it.`;
                msg.channel.send({
                    embed: {
                        color: client.INFO_COLOUR,
                        description: notInGroupText
                    }
                });
            }
        }
    }
}