
const Discord = require("discord.js");
const CLIENT = new Discord.Client();
const CONFIG = require("./config.json");
<<<<<<< HEAD
const TEAMS = require("./data/teams.json");
const

CLIENT.on('ready', () => {
	console.log(`--------------------------------------------------------`)
	console.log(`Logged in and successfully connected as ${CLIENT.user.username}.`)
	console.log(`Invite link: https://discordapp.com/oauth2/authorize?CLIENT_id=${CLIENT.user.id}&scope=bot&permissions=268446784`)
	console.log(`--------------------------------------------------------`);
	CLIENT.user.setGame("Prefix: " + CONFIG.prefix);
});

CLIENT.on("message", async message => {
	const SERVER = CLIENT.guilds.find("name", "r/AFL");

	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(CONFIG.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	args.toLowerCase();


	if(command==="team") {

		var user = message.member;
		var drop_array = [];
		var drop_array_names = [];
		var user_roles = user.roles

		/*
		* Time to find all roles to remove, and add them to a list of roles to remove.
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
			if rolearray.includes(args) {
				to_add = SERVER.roles.values().find(function(role) {
					
				});
			}
		})

	}
}





	}
=======
const EMOTES = require("./data/teamemotes.json");

CLIENT.on('ready', () => {
    console.log(`--------------------------------------------------------`)
    console.log(`Logged in and successfully connected as ${CLIENT.user.username}.`)
    console.log(`Invite link: https://discordapp.com/oauth2/authorize?CLIENT_id=${CLIENT.user.id}&scope=bot&permissions=268446784`)
    console.log(`--------------------------------------------------------`);
    CLIENT.user.setGame("Prefix: " + CONFIG.prefix);
});

CLIENT.on("message", async message => {
    const SERVER = CLIENT.guilds.find("name", "r/AFL");

    if(message.author.bot) return;

    if(message.content.indexOf(CONFIG.prefix) !== 0) return;

    const args = message.content.slice(CONFIG.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command==="team") {
        
    }
>>>>>>> 2127522359b588fddfaa5b65fdad51a1f6a80899
}