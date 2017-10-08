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

        var msg_contents = msg.content.split("");
        var home_team = msg_contents[0];
        var away_team = msg_contents[2];
        console.log(home_team, awat_team);

        const SERVER = msg.guild;
    }
}