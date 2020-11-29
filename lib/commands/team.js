var fs = require("fs");

// Import GilMcBotlin data
try {
    var TEAMS = JSON.parse(fs.readFileSync("../data/teams.json"));
    var TEAMNAMES = JSON.parse(fs.readFileSync("../data/teamnames.json"));
    var TEAMEMOTES = JSON.parse(fs.readFileSync("../data/teamemotes.json"));
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "team",
    args: true,
    help: "Add a team flair.",
    usage: "<team>",
    aliases: Array.from(COMMANDS["team"]),
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: TEAMS,
    execute: (msg, args, client) => {
        var guild = msg.guild;
        var msgMember = guild.member(msg.author);

        if (!Object.values(TEAMNAMES).includes(args)) {
            /* If the request team is not a real team (not in TEAMS array), 
             * the user didn't input a real team, so we will inform them it
             * failed
             */
            var badArgumentEmote = guild.emojis.get(client.EMOTES.badArgumentEmote);
            var errorText = `${badArgumentEmote} THAT WAS OUT OF BOUNDS! <@${msgMember.id}>: \`${args}\` is not an accepted input!\n` +
                `Refer to the following for help.\n`;
            errorText += `\nThe correct usage is: \`+${module.exports.name} ${module.exports.usage}\``;
            if (module.exports.aliases) {
                errorText += `\nOther usages allowed are:`
                for (var alias in module.exports.aliases) {
                    errorText += `\n\`+${module.exports.aliases[alias]} ${module.exports.usage}\``;
                }
            }
            var richEmbed = new Discord.RichEmbed()
                .setDescription(errorText)
                .setColor(client.ERROR_COLOUR)
            msg.channel.send(richEmbed);
            return;
        } else {
            var dropArray = [];
            var dropArrayNames = [];
            var toAdd;
            var newTeam;
            var newTeamEmote;
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
                    dropArrayNames.push(role.name);
                }
            });

            /*  We look into our TEAMS.json file and find out
             *  which team corresponds to our argument string.
             */
            Array.from(Object.keys(TEAMS)).forEach(function (teamName) {
                if (TEAMS[teamName].includes(args)) {
                    newTeam = teamName;
                    newTeamEmote = TEAMEMOTES[newTeam];
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

            if (msgMember.roles.cache.has(toAdd.id)) {
                
                var richEmbed = new Discord.RichEmbed()
                    .setDescription(`🤔 <@${msgMember.id}>: You're already a fan of ${newTeamEmote}${toAdd.name}.`)
                    .setColor(client.INFO_COLOUR)
                msg.channel.send(richEmbed);
            } else {
                msgMember.roles.remove(dropArray)
                    .then(member => {
                        member.roles.add(toAdd)
                    })
                    .then(member => {
                        var richEmbed = new Discord.RichEmbed()
                            .setDescription(`${newTeamEmote} <@${msgMember.id}> is now a fan of ${toAdd.name}!`)
                            .setColor(client.SUCCESS_COLOUR)
                        msg.channel.send(richEmbed);
                    });
            }
        }
    }
}