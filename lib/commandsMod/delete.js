module.exports = {
    name: "delete",
    args: true,
    help: "Moderator command. Deletes a specified number of messages.",
    usage: "<number of messages>",
    hide: true,
    guildOnly: true,
    modOnly: true,
    inputs: "Number of messages to delete",

    execute: async (msg, args) => {W
        var guild = msg.guild;
        var modRole = "193317014964666368"; // Umpires role
        var member = msg.member;
        var quant = parseInt(args);

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
            msg.channel.fetchMessages({
                    limit: quant + 1
                })
                .then(messages => {
                    msg.channel.bulkDelete(messages)
                        .then(deletedMessages => {
                            var removeText = `❌ ${deletedMessages.size - 1} messages have been removed by <@${member.id}>.`;
                            var removeEmbed = {
                                color: 0x33b23b, // green
                                description: removeText
                            };
                            msg.channel.send({
                                embed: removeEmbed
                            });
                        })
                        .catch(e => {
                            console.log(e)
                        })
                })
                .catch(e => {
                    console.log(e)
                })
        }
    }
}