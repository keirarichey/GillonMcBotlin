const Discord = require("discord.js");
const CLIENT = new Discord.Client();
const CONFIG = require("./config.json");
const TEAMS = require("./data/teams.json");

CLIENT.on('ready', () => {
    console.log(`--------------------------------------------------------`)
    console.log(`Logged in and successfully connected as ${CLIENT.user.username}.`)
    console.log(`Invite link: https://discordapp.com/oauth2/authorize?CLIENT_id=${CLIENT.user.id}&scope=bot&permissions=268446784`)
    console.log(`--------------------------------------------------------`);
    CLIENT.user.setGame("Prefix: " + CONFIG.prefix);
});

CLIENT.on('message', async message => {
            const SERVER = CLIENT.guilds.find("name", "r/AFL");

            if (!message.content.startsWith(prefix) || message.author.bot) return; /* If the message isn't one of ours, skip */

            const args = message.content.slice(CONFIG.prefix.length).trim().split(/ +/g); /* Define the arguments (args after command) */
            const command = args.shift().toLowerCase(); /* Define the command that is being called */
            args.toLowerCase(); /* Make arguments lower-case */


            if (command === "team") {

                var user = message.member;
                var drop_array = [];
                var drop_array_names = [];
                var user_roles = user.roles;

                /*
                 * Time to find all existing teams roles to remove, and add them to a list of roles to remove.
                 * We'll take the name, too, for admin purposes.
                 */
                user_roles.values().forEach(function(role) {
                    if TEAMS.keys().includes(role) {
                        drop_array.push(role);
                        drop_array_names.push(role.name);
                    }
                });

                /*
                 * Now we look up the role we need to add.
                 */

                TEAMS.values().forEach(function(rolearray) {
                    if rolearray.includes(args) { /* If the requested team is a real team */
                        to_add = SERVER.roles.values().find(function(role) {

                        });
                    } else {
                        channel.send("<@${user}>: \<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! `${args}` is not an accepted input!")
                    }
                })

            }
        }