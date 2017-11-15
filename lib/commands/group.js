module.exports = {
    main: (bot, msg) => {
        // Import yaml
        try {
            var yaml = require("yamljs");
        } catch (e) {
            console.log("yamljs missing. Run `npm install` first.");
            process.exit();
        }

        // Import GilMcBotlin data
        try {
            var groups = yaml.load("../data/groups.yml");
            var group_names = yaml.load("../data/groupnames.yml");
        } catch (e) {
            console.log("Could not load groups.yml and/or groupnames.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
            process.exit();
        }

        var server = msg.guild;

        var user = msg.member;
        if (!Object.values(group_names).includes(msg.content)) {
            /* If the request group is not a real group (not in groups array) */
            /* The user didn't input a real group, so we will inform them it failured */
            bot.sendNotification(`<@${user.id}>: \<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! \`${msg.content}\` is not an accepted input!\nPlease use "+help" or "<@${bot.user.id}> help" for help.`, "error", msg);
            return;
        } else {
            var to_add;
            var new_group;
            var user_roles = Array.from(user.roles.values());

            /*  We look into our groups.yml file and find out
             *  which group corresponds to our argument string.
             */
            Array.from(Object.keys(groups)).forEach(function(group_name) {
                if (groups[group_name].includes(msg.content)) {
                        new_group = group_name;
                } else {
                    return;
                }
            });

            /*  Given new_group is now styled in the way the
             *  server's roles are named, we look up in the
             *  server's roles which role is the one we want.
             */
            Array.from(server.roles.values()).forEach(function(role) {
                if (role.name == new_group) {
                    to_add = role;
                } else {
                    return;
                }
            });

            if (user.roles.has(to_add.id)) {
                bot.sendNotification(`<:thinking:364915444194344986> <@${user.id}>: You're already part of the ${to_add.name} group, so you cannot be added to it.`, "info", msg);
            } else {
                /*  We add our new role to our user_roles array.
                 */
                user_roles.push(to_add);
    
                /*  And then finally, we edit the user's roles with
                 *  our new role array.
                 */
                user.setRoles(user_roles);
    
                console.log(`@${user.displayName} is now a part of the ${to_add.name} group!`)
                bot.sendNotification(`<:white_check_mark:364924816261906432> <@${user.id}> is now a part of the ${to_add.name} group!`, "success", msg);
            }
        }
    },
    args: "Group name",
    help: "Add a gaming group to play games, including Overwatch, CS:GO and PUBG. Use +group `group name`.",
    hide: false
}