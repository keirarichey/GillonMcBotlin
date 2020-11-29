var fs = require("fs");

// Import GilMcBotlin data
try {
    var TEAMS = JSON.parse(fs.readFileSync("../data/teams.json"));
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "noteam",
    args: false,
    help: "Remove all team flairs. For the neutral supporter in all of us.",
    aliases: Array.from(COMMANDS["noteam"]),
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: null,
    execute: (msg, args, client) => {
        var msgMember = msg.guild.member(msg.author);
        var dropArray = [];
        var memberRoles = Array.from(msgMember.roles.cache.values());

        /*  We take every role in the user's existing roles,
         *  and if it is contained in teams.json, we add it
         *  to our array of roles we wish to remove.
         *  We also grab the name for logging purposes.
         *  Also note to check if it's the premier team.
         */
        memberRoles.forEach(function (role) {
            if (Object.keys(TEAMS).includes(role.name) || Object.keys(TEAMS).includes(role.name.split("🏆").join("").trim())) {
                dropArray.push(role);
            }
        });
        msgMember.roles.remove(dropArray)
            .then(member => {
                var richEmbed = new Discord.RichEmbed()
                    .setDescription(`🚫 <@${msgMember.id}> is no longer a fan of any team!`)
                    .setColor(client.SUCCESS_COLOUR)
                msg.channel.send(richEmbed);
            });
    }
}