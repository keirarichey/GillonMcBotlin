var fs = require("fs");
var Discord = require("discord.js");

// Import GilMcBotlin data
try {
    var BBLTEAMS = JSON.parse(fs.readFileSync("../data/bbl.json"));
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "nobbl",
    args: false,
    help: "Remove all BBL team flairs.",
    aliases: Array.from(COMMANDS["nobbl"]),
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: null,
    execute: (msg, args, client) => {
        var msgMember = msg.guild.member(msg.author);
        var memberRoles = Array.from(msgMember.roles.cache.values());
        var dropArray = [];

        /*  We take every role in the user's existing roles,
         *  and if it is contained in bbl.json, we add it
         *  to our array of roles we wish to remove.
         *  We also grab the name for logging purposes.
         *  Also note to check if it's the premier team.
         */
        memberRoles.forEach(function (role) {
            if (Object.keys(BBLTEAMS).includes(role.name) || Object.keys(BBLTEAMS).includes(role.name.split("🏆").join("").trim())) {
                dropArray.push(role);
            }
        });

        msgMember.roles.remove(dropArray)
            .then(member => {
                var richEmbed = new Discord.MessageEmbed()
                    .setDescription(`🚫 🏏 <@${msgMember.id}> is no longer a fan of any BBL team!`)
                    .setColor(client.SUCCESS_COLOUR)
                msg.channel.send(richEmbed);
            });
    }
}