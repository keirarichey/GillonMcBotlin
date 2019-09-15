var json = require("json");

// Import GilMcBotlin data
try {
    var BBLTEAMS = json.parse(fs.readFileSync("../data/bbl.json"));
    var COMMANDS = json.parse(fs.readFileSync("../data/commands.json"));
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
        var member = msg.member;
        var dropArray = [];

        /*  We take every role in the user's existing roles,
         *  and if it is contained in bbl.json, we add it
         *  to our array of roles we wish to remove.
         *  We also grab the name for logging purposes.
         *  Also note to check if it's the premier team.
         */
        member.roles.array().forEach(function (role) {
            if (Object.keys(BBLTEAMS).includes(role.name) || Object.keys(BBLTEAMS).includes(role.name.split("🏆").join("").trim())) {
                dropArray.push(role);
            }
        });

        member.removeRoles(dropArray);

        var nobblText = `🚫 🏏 <@${member.id}> is no longer a fan of any BBL team!`;
        msg.channel.send({
            embed: {
                color: client.SUCCESS_COLOUR,
                description: nobblText
            }
        });
    }
}