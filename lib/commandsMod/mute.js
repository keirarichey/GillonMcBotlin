module.exports = {
    name: "mute",
    args: true,
    help: "Moderator command. Mutes a selected user.",
    usage: "<user @mention>",
    aliases: ["zip", "zipit", "shutup", "silence", "oppress"],
    hide: true,
    guildOnly: true,
    modOnly: true,
    botChannelOnly: false,
    inputs: "User (as an @mention)",
    execute: (msg, args) => {
        var guild = msg.guild;
        var member = msg.member;
        var target = msg.mentions.members.first();
        var textChannels = guild.channels.filterArray(
            c => c.type == "text" &&
            !(client.CHANNELS.restrictedChannels.includes(c.id))
        );

        textChannels.forEach(function (channel) {
            channel.overwritePermissions(target, {
                SEND_MESSAGES: false
            })
        });
        target.setMute(true);

        var muteText = `🤐 <@${target.id}> has been muted by <@${member.id}>.`;
        msg.channel.send({
            embed: {
                color: 0x33b23b, // green
                description: muteText
            }
        });
    }
}