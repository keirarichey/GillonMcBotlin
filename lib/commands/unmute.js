var fs = require("fs");

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
        var member = msg.member;
        var target = msg.mentions.members.first();
        var textChannels = guild.channels.filterArray(
            c => c.type == "text" &&
            !(client.CHANNELS.restrictedChannels.includes(c.id))
        );
        var voiceChannels = guild.channels.filterArray(
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

        var unMuteText = `😮 <@${target.id}> has been unmuted by <@${member.id}>.`;
        msg.channel.send({
            embed: {
                color: client.SUCCESS_COLOUR,
                description: unMuteText
            }
        });
    }
}