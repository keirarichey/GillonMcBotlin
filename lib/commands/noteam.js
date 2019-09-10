// Import YAML
var yaml = require("yamljs");

// Import GilMcBotlin data
try {
    var teams = yaml.load("../data/teams.yml");
} catch (e) {
    console.log("Could not load teams.yml. Make sure it\'s in the GillonMcBotlin/data/ directory and is valid YML.");
}

module.exports = {
    name: "noteam",
    args: false,
    help: "Remove all team flairs. For the neutral supporter in all of us.",
    aliases: ["unteam", "noafl", "noaflteam"],
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: null,

    execute: (msg) => {
        var member = msg.member;
        var dropArray = [];

        /*  We take every role in the user's existing roles,
         *  and if it is contained in teams.yml, we add it
         *  to our array of roles we wish to remove.
         *  We also grab the name for logging purposes.
         *  Also note to check if it's the premier team.
         */
        member.roles.array().forEach(function (role) {
            if (Object.keys(teams).includes(role.name) || Object.keys(teams).includes(role.name.split("🏆").join("").trim())) {
                dropArray.push(role);
            }
        });

        member.removeRoles(dropArray);

        var noteamText = `🚫 <@${member.id}> is no longer a fan of any team!`;
        msg.channel.send({
            embed: {
                color: 0x33b23b, // green
                description: noteamText
            }
        });
    }
}