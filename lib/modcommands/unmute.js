module.exports = {
    main: (bot, msg) => {
    
            var server = msg.guild;
            var modRole = "195825790531665920"; // Umpires role
            var user = msg.member;
            var target = msg.mentions.members.first;

            if (!user.roles.has(modRole)) {
                bot.sendNotification(`You do not have permission to use that command. You must have the Umpires role to use this command.`, "error", msg);
            } else {
                for (var ch in server.channels) {
                    ch.permissionsFor(target).add("SEND_MESSAGES");
                }
                bot.sendNotification(`\<:open_mouth:402327706366115840> ${target.displayName} has been unmuted by ${user.displayName}.`, "success", msg);
            }
    },
    args: "unmutee",
    help: "Moderator command. Unmutes a selected user.",
    hide: true
}