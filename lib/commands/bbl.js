var fs = require("fs");
var Discord = require("discord.js");

// Import GilMcBotlin data
try {
    var BBLTEAMS = JSON.parse(fs.readFileSync("../data/bbl.json"));
    var BBLTEAMNAMES = JSON.parse(fs.readFileSync("../data/bblnames.json"));
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "bbl",
    args: true,
    help: "Add a BBL flair.",
    usage: "<BBL team>",
    aliases: Array.from(COMMANDS["bbl"]),
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: BBLTEAMS,
    execute: (msg, args, client) => {
        var guild = msg.guild;
        var msgMember = guild.member(msg.author);

        if (!Object.values(BBLTEAMNAMES).includes(args)) {
            /* If the request team is not a real team (not in teams array), 
             * the user didn't input a real team, so we will inform them it
             * failed
             */
            var errorText = `🦆 OUT FOR A DUCK! <@${msgMember.id}>: \`${args}\` is not an accepted input!\n` +
                `Refer to the following for help.\n`;
            errorText += `\nThe correct usage is: \`+${module.exports.name} ${module.exports.usage}\``;
            if (module.exports.aliases) {
                errorText += `\nOther usages allowed are:`
                for (var alias in module.exports.aliases) {
                    errorText += `\n\`+${module.exports.aliases[alias]} ${module.exports.usage}\``;
                }
            }
            var richEmbed = new Discord.MessageEmbed()
                .setDescription(errorText)
                .setColor(ERROR_COLOUR);
            msg.channel.send(richEmbed);
            return;
        } else {
            var dropArray = [];
            var dropArrayNames = [];
            var toAdd;
            var newTeam;
            var memberRoles = Array.from(msgMember.roles.cache.values());

            /*  We take every role in the user's existing roles,
             *  and if it is contained in bbl.json, we add it
             *  to our array of roles we wish to remove.
             *  We also grab the name for logging purposes.
             *  Also note to check if it's the premier team.
             */
            memberRoles.forEach(function (role) {
                if (Object.keys(BBLTEAMS).includes(role.name) || Object.keys(BBLTEAMS).includes(role.name.split("🏆").join("").trim())) {
                    dropArray.push(role);
                    dropArrayNames.push(role.name);
                }
            });

            /*  We look into our bbl.json file and find out
             *  which team corresponds to our argument string.
             */
            Array.from(Object.keys(BBLTEAMS)).forEach(function (teamName) {
                if (BBLTEAMS[teamName].includes(args)) {
                    newTeam = teamName;
                }
            });

            /*  Given newTeam is now styled in the way the
             *  server's roles are named, we look up in the
             *  server's roles which role is the one we want.
             *  Note, the role may have cups to indicate the
             *  premier team.
             */
            Array.from(guild.roles.cache.values()).forEach(function (role) {
                if (role.name == newTeam || role.name == "🏆 " + newTeam + " 🏆") {
                    toAdd = role;
                }
            });

            msgMember.roles.remove(dropArray)
                .then(member => {
                    member.roles.add(toAdd)
                })
                .then(member => {
                    var richEmbed = new Discord.MessageEmbed()
                        .setDescription(`🏏 <@${msgMember.id}> is now a fan of ${toAdd.name}!`)
                        .setColor(client.SUCCESS_COLOUR)
                    msg.channel.send(richEmbed);
                });
        }
    }
}