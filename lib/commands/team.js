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
        var member = msg.member;

        if (!Object.values(TEAMNAMES).includes(args)) {
            /* If the request team is not a real team (not in TEAMS array), 
             * the user didn't input a real team, so we will inform them it
             * failed
             */
            var badArgumentEmote = guild.emojis.get(client.EMOTES.badArgumentEmote);
            var errorText = `${badArgumentEmote} THAT WAS OUT OF BOUNDS! <@${member.id}>: \`${args}\` is not an accepted input!\n` +
                `Refer to the following for help.\n`;
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
            var dropArray = [];
            var dropArrayNames = [];
            var toAdd;
            var newTeam;
            var newTeamEmote;
            var memberRoles = Array.from(member.roles.values());

            /*  We take every role in the user's existing roles,
             *  and if it is contained in teams.json, we add it
             *  to our array of roles we wish to remove.
             *  We also grab the name for logging purposes.
             *  Also note to check if it's the premier team.
             */
            Array.from(member.roles.values()).forEach(function (role) {
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
                }
            });

            Array.from(Object.keys(TEAMEMOTES)).forEach(function (team) {
                if (newTeam == team) {
                    newTeamEmote = TEAMEMOTES[team];
                }
            });

            /*  Given newTeam is now styled in the way the
             *  server's roles are named, we look up in the
             *  server's roles which role is the one we want.
             *  Note, the role may have cups to indicate the
             *  premier team.
             */
            Array.from(guild.roles.values()).forEach(function (role) {
                if (role.name == newTeam || role.name == "🏆 " + newTeam + " 🏆") {
                    toAdd = role;
                }
            });

            /*  First, we take every role to dropArray, then
             *  remove it from the memberRoles array.
             */
            dropArray.forEach(function (role) {
                var index = memberRoles.indexOf(role);
                if (index > -1) {
                    memberRoles.splice(index, 1);
                }
            });

            if (member.roles.has(toAdd.id)) {
                var inTeamText = `🤔 <@${member.id}>: You're already a fan of ${newTeamEmote}${toAdd.name}.`;
                msg.channel.send({
                    embed: {
                        color: client.INFO_COLOUR,
                        description: inTeamText
                    }
                });
            } else {
                /*  Then, we add our new role to our memberRoles
                 *  array.
                 */
                memberRoles.push(toAdd);

                /*  And then finally, we edit the user's roles with
                 *  our new role array.
                 */
                member.setRoles(memberRoles);

                var teamText = `${newTeamEmote} <@${member.id}> is now a fan of ${toAdd.name}!`;
                msg.channel.send({
                    embed: {
                        color: client.SUCCESS_COLOUR,
                        description: teamText
                    }
                });
            }
        }
    }
}