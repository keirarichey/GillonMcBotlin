module.exports = {
    main: (bot, msg) => {
        // Import YAML
        try {
            var yaml = require("yamljs");
        } catch (e) {
            console.log("yamljs missing. Run `npm install` first.");
            process.exit();
        }


        // Import GilMcBotlin data
        try {
            var teams = yaml.load("../data/teams.yml");
            var team_names = yaml.load("../data/teamnames.yml");
            var team_emotes = yaml.load("../data/teamemotes.yml");
        } catch (e) {
            console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the GillonMcBotlin/data/ directory and are valid YML.");
            process.exit();
        }

        const SERVER = msg.guild;
        // If the input is not a real team, inform the user
        if (!Object.values(team_names).includes(msg.content)) {
            bot.sendNotification(`<@${user.id}>: \<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! \`${msg.content}\` is not an accepted input!\nPlease use "+help" or "<@${bot.user.id}> help" for help.`, "error", msg);
        }

    },
    args: "Team name, nickname, or abbreviation.",
    help: "Displays the current score for a match with +afl `team name`.",
    hide: false
}

// msg.channel.send(`Sorry, no games are on! <:vicbias:275912832992804865> <:rupert:345506442041622538>`);