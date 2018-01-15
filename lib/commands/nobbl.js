module.exports = {
    main: (bot, msg) => {
        var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam
        if (msg.channel == botChannel) {
            // Import yaml
            try {
                var yaml = require("yamljs");
            } catch (e) {
                console.log("yamljs missing. Run `npm install` first.");
                process.exit();
            }
    
            // Import GilMcBotlin data
            try {
                var bblTeams = yaml.load("../data/bbl.yml");
                var bblTeamNames = yaml.load("../data/bblnames.yml");
            } catch (e) {
                console.log("Could not load bbl.yml, and/or bblnames.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
                process.exit();
            }
    
            var server = msg.guild;
            var confirmed_role = "283573666351022081";
    
            var user = msg.member;
            var drop_array = [];
            var user_roles = user.roles.array();
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
            user.roles.array().forEach(function(role) {
                if (Object.keys(bblTeams).includes(role.name) || Object.keys(bblTeams).includes(role.name.split("🏆").join("").trim())) {
                    drop_array.push(role);
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
    
            /*  And then  we edit the user's roles with our
             *  new role array.
             */
            //user.setRoles(user_roles);

            user.removeRoles(drop_array);
            // console.log(`Removed ${drop_array_names} from ${user.displayName}.`)
            bot.sendNotification(`<:no_entry_sign:364917720212439041> <:cricket:380975256648810496> <@${user.id}> is no longer a fan of any BBL team!`, "success", msg);
        }
    },
    args: "",
    help: "Remove all BBL team flairs. Use +nobbl. For those who *don't like cricket, oh no*.",
    hide: false
}