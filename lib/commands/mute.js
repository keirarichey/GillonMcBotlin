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
                SEND_MESSAGES: false
            })
        });
        voiceChannels.forEach(function (channel) {
            channel.overwritePermissions(target, {
                SPEAK: false
            })
        });

        var muteText = `🤐 <@${target.id}> has been muted by <@${member.id}>.`;
        msg.channel.send({
            embed: {
                color: client.SUCCESS_COLOUR,
                description: muteText
            }
        });
    }
}