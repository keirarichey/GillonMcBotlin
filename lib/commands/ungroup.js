var fs = require("fs");
var Discord = require("discord.js");

// Import GilMcBotlin data
try {
    var GROUPS = JSON.parse(fs.readFileSync("../data/groups.json"));
    var GROUPNAMES = JSON.parse(fs.readFileSync("../data/groupnames.json"));
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "ungroup",
    args: true,
    help: "Remove a gaming group.",
    usage: "<group>",
    aliases: Array.from(COMMANDS["ungroup"]),
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: GROUPS,
    execute: (msg, args, client) => {
        var guild = msg.guild;
        var msgMember = guild.member(msg.author);

        if (!Object.values(GROUPNAMES).includes(args)) {
            /* If the request group is not a real group (not in GROUPS array) */
            /* The user didn't input a real group, so we will inform them it failured */
            var errorText = `🚫 🎮 CLEARLY NOT A GADGET-TYPE OPERATOR! <@${msgMember.id}>: \`${args}\` is not an accepted input!\n` +
                `Consult a computer boffin or a real nerd for help.`;
            errorText += `\nThe correct usage is: \`+${module.exports.name} ${module.exports.usage}\``;
            if (module.exports.aliases) {
                errorText += `\nOther usages allowed are:`
                for (var alias in module.exports.aliases) {
                    errorText += `\n\`+${module.exports.aliases[alias]} ${module.exports.usage}\``;
                }
            }
            var richEmbed = new Discord.MessageEmbed()
                .setDescription(errorText)
                .setColor(client.ERROR_COLOUR);
            msg.channel.send(richEmbed);
            return;
        } else {
            var roleName;
            var toRemove;

            /*  We look into our groups.json file and find out
             *  which group corresponds to our argument string.
             */
            Array.from(Object.keys(GROUPS)).forEach(function (groupName) {
                if (GROUPS[groupName].includes(args)) {
                    roleName = groupName;
                }
            });

            Array.from(guild.roles.cache.values()).forEach(function (role) {
                if (role.name == roleName) {
                    toRemove = role;
                }
            });

            if (msgMember.roles.cache.has(toRemove.id)) {
                msgMember.roles.remove(toRemove)
                    .then(member => {
                        var richEmbed = new Discord.MessageEmbed()
                            .setDescription(`❎ <@${msgMember.id}> is no longer a part of the ${toRemove.name} group!`)
                            .setColor(client.SUCCESS_COLOUR);
                        msg.channel.send(richEmbed);
                    });
            } else {
                var richEmbed = new Discord.MessageEmbed()
                    .setDescription(`🤔 <@${msgMember.id}>: You're not a part of the ${toRemove.name} group, so you cannot be removed from it.`)
                    .setColor(client.INFO_COLOUR);
                msg.channel.send(richEmbed);
            }
        }
    }
}