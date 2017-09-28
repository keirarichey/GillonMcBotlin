
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
        const botmsg = await message.channel.send("Hi! To add a team role, please select your team in the reactions.\n\nTo remove any team you choose, just remove your react.");
        for (let i = 0, len = Object.values(EMOTES).length; i < len; i++) {
            botmsg.react(SERVER.emojis.get(Object.values(EMOTES)[i]));
        }
        botmsg.awaitReactions(() => {
            
        });
    }
}