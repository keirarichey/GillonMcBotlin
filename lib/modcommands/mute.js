module.exports = {
    main: (bot, msg) => {
    
            var server = msg.guild;
            var modRole = "195825790531665920"; // Umpire role
            var user = msg.member;
            var target = msg.mentions.members;
            console.log(target)

            if (!user.roles.has(modRole)) {
                bot.sendNotification(`You do not have permission to use that command. You must have the Umpires role to use this command.`, "error", msg);
            } else {
                for (var ch in server.channels) {
                    ch.permissionsFor(target).remove("SEND_MESSAGES");
                }
                bot.sendNotification(`\<:zipper_mouth:402327542482337812> ${target.displayName} has been muted by ${user.displayName}.`, "success", msg);
            }
    },
    args: "mutee",
    help: "Moderator command. Mutes a selected user.",
    hide: true
}