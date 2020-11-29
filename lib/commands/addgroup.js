var fs = require("fs");
var Discord = require("discord.js");

// Import GilMcBotlin data
try {
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
    var GROUPS = JSON.parse(fs.readFileSync("../data/groups.json"));
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "addgroup",
    args: true,
    help: "Adds a new group and role.",
    usage: "<command> <alias> [ | <alias> ]+",
    aliases: Array.from(COMMANDS["addgroup"]),
    hide: true,
    guildOnly: true,
    modOnly: true,
    botChannelOnly: true,
    inputs: Array.from(Object.keys(COMMANDS)),
    execute: (msg, args, client) => {
        var guild = msg.guild;
        var msgMember = guild.member(msg.author);
        var groupName = args.split("|").slice(0, 1); // First element
        var aliases = args.split("|").slice(1); // All except first element

        guild.roles.create({
                name: groupName,
                menitonable: true
            })
            .then(role => {
                console.log(`${msgMember.displayName} created new group role ${role.name}.`);
                if (aliases) {
                    GROUPS[groupName] = aliases;
                } else {
                    GROUPS[groupName] = [null];
                }

                var writeFileError;
                fs.writeFileSync("../data/groups.json", JSON.stringify(GROUPS), (err) => {
                    if (err) {
                        console.log(err);
                        writeFileError = true;
                    }
                });

                if (!writeFileError) {
                    var richEmbed = Discord.RichEmbed()
                        .setDescription(`📜 ${groupName} is now an group! Its aliases are \`${aliases.join(" ")}\``)
                        .setColor(client.SUCCESS_COLOUR);
                    msg.channel.send(richEmbed);
                }
            })
            .catch(console.error)
    }
}