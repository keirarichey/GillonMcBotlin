var fs = require("fs");
var Discord = require("discord.js");

// Import GilMcBotlin data
try {
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "unmute",
    args: true,
    help: "Moderator command. Unmutes a selected user.",
    usage: "<user @mention>",
    hide: true,
    guildOnly: true,
    modOnly: true,
    botChannelOnly: false,
    inputs: "User (as an @mention)",
    execute: (msg, args, client) => {

        var guild = msg.guild;
        var msgMember = guild.member(msg.author);
        var target = msg.mentions.members.first();
        var textChannels = guild.channels.filter(
            c => c.type == "text" &&
            !(client.CHANNELS.restrictedChannels.includes(c.id))
        );
        var voiceChannels = guild.channels.filter(
            c => c.type == "voice" &&
            !(client.CHANNELS.restrictedChannels.includes(c.id))
        );

        textChannels.forEach(function (channel) {
            channel.overwritePermissions(target, {
                SEND_MESSAGES: null
            })
        });
        voiceChannels.forEach(function (channel) {
            channel.overwritePermissions(target, {
                SPEAK: null
            })
        });

        var richEmbed = Discord.RichEmbed()
            .setDescription(`😮 <@${target.id}> has been unmuted by <@${msgMember.id}>.`)
            .setColor(client.SUCCESS_COLOUR)
        msg.channel.send(richEmbed);
    }
}