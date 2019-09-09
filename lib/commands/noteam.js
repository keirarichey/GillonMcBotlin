var loadError = false;

// Import YAML
try {
    var yaml = require("yamljs");
} catch (e) {
    console.log("yamljs missing. Run `npm install` first.");
    loadError = true;
}

// Import GilMcBotlin data
try {
    var teams = yaml.load("../data/teams.yml");
    var teamNames = yaml.load("../data/teamnames.yml");
    var teamEmotes = yaml.load("../data/teamemotes.yml");
} catch (e) {
    console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the GillonMcBotlin/data/ directory and are valid YML.");
    loadError = true;
}

var checkLoad = function (msg) {
    if (loadError) {
        var loadErrorEmbed = {
            color: 0xe24540, // red
            description: "There was an error loading this command."
        };
        msg.channel.send({
                embed: loadErrorEmbed
            })
            .catch(e => {
                console.log(`LoadCommand Error:\n` +
                    `${e}\n` +
                    `Member: ${msg.author.displayName}\n` +
                    `Channel: ${msg.channel.name}\n`);
            });
        return;
    }
}

module.exports = {
    name: "noteam",
    args: false,
    help: "Remove all team flairs. For the neutral supporter in all of us.",
    hide: false,
    guildOnly: true,
    inputs: null,

    execute: (msg, args) => {
        checkLoad(msg);

        var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam

        if (msg.channel !== botChannel) {
            return;
        }

        var guild = msg.guild;
        var confirmedRole = "283573666351022081";
        var member = msg.member;
        var dropArray = [];
        var memberRoles = member.roles.array();
        /*  Adds the confirmed role, just to make sure that
         *  we don't accidentally kick anyone from the server
         *  for not being Confirmed. It's assumed that if they
         *  can use this command, they must already be allowed
         *  in the server.
         */
        if (!member.roles.has(confirmedRole)) {
            memberRoles.push(guild.roles.find("name", "Confirmed"));
        }
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
        var noteamEmbed = {
            color: 0x33b23b, // green
            description: noteamText
        };
        msg.channel.send({
            embed: noteamEmbed
        });
    }
}