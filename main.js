
const Discord = require("discord.js");
const CLIENT = new Discord.Client();
const CONFIG = require("./config.json");
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
}