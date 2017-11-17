module.exports = {
    main: (bot, msg) => {
        // Import YAML
        try {
            var yaml = require("yamljs");
        } catch (e) {
            console.log("yamljs missing. Run `npm install` first.");
        }

        // Import GilMcBotlin data
        try {
            var bblTeams = yaml.load("../data/bbl.yml");
            var bblTeamNames = yaml.load("../data/bblnames.yml");
        } catch (e) {
            console.log("Could not load bbl.yml, bblnames.yml. Make sure it\'s in the GillonMcBotlin/data/ directory and is valid YML.");
        }

        var server = msg.guild;
        var confirmed_role = "283573666351022081";

        var user = msg.member;
        if (!Object.values(bblTeamNames).includes(msg.content.toLowerCase())) {
            /* If the request team is not a real team (not in teams array) */
            /* The user didn't input a real team, so we will inform them it failured */
            bot.sendNotification(`<@${user.id}>: \<:duck:380975868383592450> OUT FOR A DUCK! \`${msg.content.toLowerCase()}\` is not an accepted input!\nPlease use "+help" or "<@${bot.user.id}> help" for help.`, "error", msg);
            return;
        } else {
            var drop_array = [];
            var drop_array_names = [];
            var to_add;
            var new_team;
            var new_team_emote;
            var user_roles = Array.from(user.roles.values());

            /*  Adds the confirmed role, just to make sure that
             *  we don't accidentally kick anyone from the server
             *  for not being Confirmed. It's assumed that if they
             *  can use this command, they must already be allowed
             *  in the server.
             */
            if (!user.roles.has(confirmed_role)) {
                user_roles.push(server.roles.find("name", "Confirmed"));
            }

            /*  We take every role in the user's existing roles,
             *  and if it is contained in bbl.yml, we add it
             *  to our array of roles we wish to remove.
             *  We also grab the name for logging purposes.
             *  Also note to check if it's the premier team.
             */
            Array.from(user.roles.values()).forEach(function(role) {
                if (Object.keys(bblTeams).includes(role.name) || Object.keys(bblTeams).includes(role.name.split("🏆").join("").trim())) {
                    drop_array.push(role);
                    drop_array_names.push(role.name);
                }
            });

            /*  We look into our bbl.yml file and find out
             *  which team corresponds to our argument string.
             */
            Array.from(Object.keys(bblTeams)).forEach(function(team_name) {
                if (bblTeams[team_name].includes(msg.content.toLowerCase())) {
                        new_team = team_name;
                } else {
                    return;
                }
            });

            /*  Given new_team is now styled in the way the
             *  server's roles are named, we look up in the
             *  server's roles which role is the one we want.
             *  Note, the role may have cups to indicate the
             *  premier team.
             */
            Array.from(server.roles.values()).forEach(function(role) {
                if (role.name == new_team || role.name == "🏆 " + new_team + " 🏆") {
                    to_add = role;
                } else {
                    return;
                }
            });

            /*  First, we take every role to drop_array, then
             *  remove it from the user_roles array.
             */
            drop_array.forEach(function(role) {
                var index = user_roles.indexOf(role);
                if (index > -1) {
                    user_roles.splice(index, 1);
                }
            });

            /*  Then, we add our new role to our user_roles
             *  array.
             */
            user_roles.push(to_add);

            /*  And then finally, we edit the user's roles with
             *  our new role array.
             */
            user.setRoles(user_roles);

            // console.log(`Removed ${drop_array_names} from ${user.displayName}.`)
            // console.log(`@${user.displayName} is now a fan of ${to_add.name}!`)
            bot.sendNotification(`<:cricket:380975256648810496> <@${user.id}> is now a fan of ${to_add.name}!`, "success", msg);
        }
    },
    args: "Team name, nickname, or abbreviation.",
    help: "Add a BBL flair with +bbl `your bbl team`.",
    hide: false
}