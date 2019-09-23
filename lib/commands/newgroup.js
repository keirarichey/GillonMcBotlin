var fs = require("fs");

// Import GilMcBotlin data
try {
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
    var GROUPS = JSON.parse(fs.readFileSync("../data/groups.json"));
} catch (e) {
    console.log(e);
}

var commandFiles = fs.readdirSync(`./commands`);
for (var file of commandFiles) {
    try {
        var command = require(`./${file}`);
        var commandAliases = command.aliases
        var commandName = command.name
        if (!Array.from(Object.keys(COMMANDS)).includes(commandName)) {
            COMMANDS[commandName] = commandAliases;
        }
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    name: "newgroup",
    args: true,
    help: "Adds a new group and role.",
    usage: "<command> <alias> [<alias>]+",
    aliases: Array.from(COMMANDS["newgroup"]),
    hide: true,
    guildOnly: true,
    modOnly: true,
    botChannelOnly: true,
    inputs: Array.from(Object.keys(COMMANDS)),
    execute: (msg, args, client) => {
        var guild = msg.guild;
        var groupName = args;

        guild.createRole({
                name: groupName,
                menitonable: true
            })
            .then(role => console.log(`${msg.member.displayName} created new group role ${role.name}.`))
            .catch(console.error)

        GROUPS[groupName] = [null];

        var writeFileError;
        fs.writeFileSync("../data/groups.json", JSON.stringify(GROUPS), (err) => {
            if (err) {
                console.log(err);
                writeFileError = true
            }
        });
//TODO
        // if (!writeFileError) {
        //     var isAre;
        //     if (aliases.length === 1) {
        //         isAre = "is"
        //     } else if (aliases.length > 1) {
        //         isAre = "are"
        //     }
        //     var aliasesText = `📜 ${aliases.join(" ")} ${isAre} now an alias for ${command}! \`${client.PREFIX}${command} ${Array.from(COMMANDS[command]).join("|")}\` is now valid.`;
        //     msg.channel.send({
        //         embed: {
        //             color: client.SUCCESS_COLOUR,
        //             description: aliasesText
        //         }
        //     });
        // }
    }
}