module.exports = {
    name: "unmute",
    args: true,
    help: "Moderator command. Unmutes a selected user.",
    usage: "<userMention>",
    hide: true,
    guildOnly: true,
    inputs: "User ping",

    execute: (msg, args) => {

        var guild = msg.guild;
        var modRole = "193317014964666368"; // Umpires role
        var member = msg.member;
        var target = msg.mentions.members.first();

        if (!member.roles.has(modRole)) {
            var permissionText = `\<:gil:411107473907515392> You do not have permission to use that command. You must have the Umpires role to use this command.`;
            var permissionEmbed = {
                color: 0xe24540, // red
                description: permissionText
            };
            msg.channel.send({
                embed: permissionEmbed
            });
        } else {
            var channelIDs = ["271391673236455428", "280250705946607618", "387580588850151424", "193315916484706305"];
            var textChannels = guild.channels.filterArray(c => c.type == "text" && !(channelIDs.includes(c.id)));
            textChannels.forEach(function (channel) {
                channel.overwritePermissions(target, {
                    SEND_MESSAGES: true
                })
            });
            target.setMute(false);
            var unMuteText = `😮 <@${target.id}> has been unmuted by <@${member.id}>.`;
            var unMuteEmbed = {
                color: 0x33b23b, // green
                description: unMuteText
            };
            msg.channel.send({
                embed: unMuteEmbed
            });
        }
    }
}