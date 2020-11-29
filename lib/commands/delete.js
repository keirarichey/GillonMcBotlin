var fs = require("fs");

// Import GilMcBotlin data
try {
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
} catch (e) {
    console.log(e);

}module.exports = {
    name: "delete",
    args: true,
    help: "Moderator command. Deletes a specified number of messages.",
    usage: "<number of messages>",
    hide: true,
    guildOnly: true,
    modOnly: true,
    botChannelOnly: false,
    inputs: "Number of messages to delete",
    execute: async (msg, args, client) => {
        var member = msg.member;
        var quant = parseInt(args);

        msg.channel.fetchMessages({
                limit: quant + 1
            })
            .then(messages => {
                msg.channel.bulkDelete(messages)
                    .then(deletedMessages => {
                        var richEmbed = new Discord.RichEmbed()
                            .setDescription(`❌ ${deletedMessages.size - 1} messages have been removed by <@${member.id}>.`)
                            .setColor(client.SUCCESS_COLOUR)
                        msg.channel.send(richEmbed);
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