// Import YAML=
var yaml = require("yamljs");

// Import GilMcBotlin data
try {
    var bblTeams = yaml.load("../data/bbl.yml");
    var bblTeamNames = yaml.load("../data/bblnames.yml");
    var COMMANDS = yaml.load("../data/commands.yml");
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
    inputs: bblTeams,
    execute: (msg, args, client) => {
        var guild = msg.guild;
        var member = msg.member;

        if (!Object.values(bblTeamNames).includes(args)) {
            /* If the request team is not a real team (not in teams array), 
             * the user didn't input a real team, so we will inform them it
             * failed
             */
            var errorText = `🦆 OUT FOR A DUCK! <@${member.id}>: \`${args}\` is not an accepted input!\n` +
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
            var memberRoles = Array.from(member.roles.values());

            /*  We take every role in the user's existing roles,
             *  and if it is contained in bbl.yml, we add it
             *  to our array of roles we wish to remove.
             *  We also grab the name for logging purposes.
             *  Also note to check if it's the premier team.
             */
            Array.from(member.roles.values()).forEach(function (role) {
                if (Object.keys(bblTeams).includes(role.name) || Object.keys(bblTeams).includes(role.name.split("🏆").join("").trim())) {
                    dropArray.push(role);
                    dropArrayNames.push(role.name);
                }
            });

            /*  We look into our bbl.yml file and find out
             *  which team corresponds to our argument string.
             */
            Array.from(Object.keys(bblTeams)).forEach(function (teamName) {
                if (bblTeams[teamName].includes(args)) {
                    newTeam = teamName;
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

            /*  Then, we add our new role to our memberRoles
             *  array.
             */
            memberRoles.push(toAdd);

            /*  And then finally, we edit the user's roles with
             *  our new role array.
             */
            member.setRoles(memberRoles);

            var bblText = `🏏 <@${member.id}> is now a fan of ${toAdd.name}!`;
            msg.channel.send({
                embed: {
                    color: client.SUCCESS_COLOUR,
                    description: bblText
                }
            });
        }
    }
}