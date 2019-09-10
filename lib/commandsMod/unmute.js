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

        textChannels.forEach(function (channel) {
            channel.overwritePermissions(target, {
                SEND_MESSAGES: null
            })
        });
        target.setMute(false);

        var unMuteText = `😮 <@${target.id}> has been unmuted by <@${member.id}>.`;
        msg.channel.send({
            embed: {
                color: 0x33b23b, // green
                description: unMuteText
            }
        });
    }
}