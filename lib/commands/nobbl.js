// Import yaml
var yaml = require("yamljs");

// Import GilMcBotlin data
try {
    var bblTeams = yaml.load("../data/bbl.yml");
} catch (e) {
    console.log("Could not load bbl.yml. Make sure it\'s in the gilmcbotlin/data/ directory and is valid yml.");
}

module.exports = {
    name: "nobbl",
    args: false,
    help: "Remove all BBL team flairs.",
    aliases: ["unbbl", "uncricket", "nocricket", "notcricket"],
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: null,
    execute: (msg) => {
        var member = msg.member;
        var dropArray = [];

        /*  We take every role in the user's existing roles,
         *  and if it is contained in bbl.yml, we add it
         *  to our array of roles we wish to remove.
         *  We also grab the name for logging purposes.
         *  Also note to check if it's the premier team.
         */
        member.roles.array().forEach(function (role) {
            if (Object.keys(bblTeams).includes(role.name) || Object.keys(bblTeams).includes(role.name.split("🏆").join("").trim())) {
                dropArray.push(role);
            }
        });

        member.removeRoles(dropArray);

        var nobblText = `🚫 🏏 <@${member.id}> is no longer a fan of any BBL team!`;
        msg.channel.send({
            embed: {
                color: 0x33b23b, // green
                description: nobblText
            }
        });
    }
}