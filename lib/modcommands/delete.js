module.exports = {
    main: (bot, msg) => {
    
        var server = msg.guild;
        var modRole = "195825790531665920"; // Umpires role
        var user = msg.member;
        var quant = parseInt(msg.content);

        if (!user.roles.has(modRole)) {
            bot.sendNotification(`\<:gil:411107473907515392> You do not have permission to use that command. You must have the Umpires role to use this command.`, "error", msg);
        } else {
            try {
                var fetched = msg.channel.fetchMessages({limit: quant});
                msg.channel.bulkDelete(fetched);
            } catch (e) {
                console.log(e);
            }
            bot.sendNotification(`❌ ${quant} messages have been removed by ${user.displayName}.`, "success", msg);
        }
    },
    args: "mutee",
    help: "Moderator command. Deletes a specified number of messages.",
    hide: true
}