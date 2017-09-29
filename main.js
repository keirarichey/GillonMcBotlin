const Discord = require("discord.js");
const YAML = require('yamljs');
const CLIENT = new Discord.Client();
const CONFIG = require("./config.json");
const TEAMS = YAML.load('./data/teams.yml')
const TEAMNAMES = YAML.load('./data/teamnames.yml')
const prefix = CONFIG["prefix"];	

CLIENT.on('ready', () => {
    console.log(`--------------------------------------------------------`)
    console.log(`Logged in and successfully connected as ${CLIENT.user.username}.`)
    console.log(`Invite link: https://discordapp.com/oauth2/authorize?CLIENT_id=${CLIENT.user.id}&scope=bot&permissions=268446784`)
    console.log(`--------------------------------------------------------`);
    CLIENT.user.setGame("prefix: " + CONFIG.prefix);
});

CLIENT.on('message', async message => {
            const SERVER = CLIENT.guilds.find("name", "r/AFL");

            if (!message.content.startsWith(prefix) || message.author.bot) return; /* If the message isn't one of ours, skip */

            var args = message.content.slice(CONFIG.prefix.length).trim().split(/ +/g); /* Define the arguments (args after command) */
            const command = args.shift().toLowerCase(); /* Define the command that is being called */
            args = args.join(" ").toLowerCase(); /* Make arguments lower-case, make into one string */

            if (command === "team") {

                var user = message.member;
                var drop_array = [];
                var drop_array_names = [];
                var user_roles = user.roles;

                /*
                 * Time to find all existing teams roles to remove, and add them to a list of roles to remove.
                 * We'll take the name, too, for admin purposes.
                 */
                Array.from(user_roles.values()).forEach(function(role) {
                    if (Object.keys(TEAMS).includes(role)) {
                        drop_array.push(role);
                        drop_array_names.push(role.name);
                    }
                });

                /*
                 * Now we look up the role we need to add.
                 */
                
                if (!Object.values(TEAMNAMES).includes(args)) { /* If the request team is not a real team (not in teams array) */
                	/* The user didn't input a real team, so we will inform them it failured */
                    message.channel.send(`${user}: \<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! \`${args}\` is not an accepted input!`);
                	return;
                } else {
                	/* Change team, etc. */

                    /* Remove roles using drop array, and log for admin purposes */
                    user.removeRoles(drop_array);
                    /* Insert logging here */

                    /* Search the TEAMS array for our team nickname */
                    var newteam;
                    Array.from(TEAMS).forEach(function (key, array) {
                        if (array.includes(args)) { /* If the array of nicknames includes our nickname */
                            newteam = key;/* Team is the proper team */l
                        };
                    });

                    var role = Array.from(SERVER.roles.values()).forEach(function (role) { /* Search server roles for proper team ID */
                        if (role.name === newteam){
                            return role;
                        }
                    });
                    user.addRole(role);
                };

            };

            if (command === "group") {

            };

            if (command === "ungroup") {

            };

            if (command === "noteam") {
                
            };
        });

CLIENT.login(CONFIG["token"]);