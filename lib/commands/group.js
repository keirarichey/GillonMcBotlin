var loadError = false;

// Import yaml
try {
    var yaml = require("yamljs");
} catch (e) {
    console.log("yamljs missing. Run `npm install` first.");
    loadError = true;
}

// Import GilMcBotlin data
try {
    var groups = yaml.load("../data/groups.yml");
    var groupNames = yaml.load("../data/groupnames.yml");
} catch (e) {
    console.log("Could not load groups.yml and/or groupnames.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
    loadError = true;
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
    name: "group",
    args: true,
    help: "Add a gaming group to play games, including Overwatch, CS:GO, Age of Empires 2, and more.",
    usage: "<group>",
    aliases: ["game", "gaming"],
    hide: false,
    guildOnly: true,
    inputs: groups,

    execute: (msg, args) => {
        checkLoad(msg);

        var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam

        if (msg.channel !== botChannel) {
            return;
        }

        var guild = msg.guild;
        var member = msg.member;

        if (!Object.values(groupNames).includes(args)) {
            /* If the request group is not a real group (not in groups array) */
            /* The user didn't input a real group, so we will inform them it failured */
            var errorText = `🎮 CLEARLY NOT A GADGET-TYPE OPERATOR! <@${member.id}>: \`${args}\` is not an accepted input!\n` +
                `Refer to the following for help, or consult a computer-type boffin.\n`;

            errorText += `\nThe correct usage is: \`+${module.exports.name} ${module.exports.usage}\``;
            if (module.exports.aliases) {
                errorText += `\nOther usages allowed are:`
                for (var alias in module.exports.aliases) {
                    errorText += `\n\`+${module.exports.aliases[alias]} ${module.exports.usage}\``;
                }
            }

            var errorEmbed = {
                color: 0xe24540, // red
                description: errorText
            };

            msg.channel.send({
                embed: errorEmbed
            });
            return;
        } else {
            var toAdd;
            var newGroup;
            var memberRoles = Array.from(member.roles.values());

            /*  We look into our groups.yml file and find out
             *  which group corresponds to our argument string.
             */
            Array.from(Object.keys(groups)).forEach(function (groupName) {
                if (groups[groupName].includes(args)) {
                    newGroup = groupName;
                } else {
                    return;
                }
            });

            /*  Given newGroup is now styled in the way the
             *  server's roles are named, we look up in the
             *  server's roles which role is the one we want.
             */
            Array.from(guild.roles.values()).forEach(function (role) {
                if (role.name == newGroup) {
                    toAdd = role;
                } else {
                    return;
                }
            });

            if (member.roles.has(toAdd.id)) {
                var inGroupText = `🤔 <@${member.id}>: You're already part of the ${toAdd.name} group, so you cannot be added to it.`;
                var inGroupEmbed = {
                    color: 0xe2a640, // yellow
                    description: inGroupText
                };
                msg.channel.send({
                    embed: inGroupEmbed
                });
            } else {
                // We add our new role to our memberRoles array.
                memberRoles.push(toAdd);

                /*  And then finally, we edit the user's roles with
                 *  our new role array.
                 */
                member.setRoles(memberRoles);

                var groupText = `✅ <@${member.id}> is now a part of the ${toAdd.name} group!`;
                var groupEmbed = {
                    color: 0x33b23b, // green
                    description: groupText
                };
                msg.channel.send({
                    embed: groupEmbed
                });
            }
        }
    }
}