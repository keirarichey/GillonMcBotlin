module.exports = {
    name: "mute",
    args: true,
    help: "Moderator command. Mutes a selected user.",
    usage: "<user mention>",
    aliases: ["zip", "zipit", "shutup"],
    hide: true,
    guildOnly: true,
    modOnly: true,
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
                    SEND_MESSAGES: false
                })
            });
            target.setMute(true);
            var muteText = `🤐 <@${target.id}> has been muted by <@${member.id}>.`;
            var muteEmbed = {
                color: 0x33b23b, // green
                description: muteText
            };
            msg.channel.send({
                embed: muteEmbed
            });
        }
    }
}