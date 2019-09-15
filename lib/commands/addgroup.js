var fs = require("fs");

// Import GilMcBotlin data
try {
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
    var GROUPS = JSON.parse(fs.readFileSync("../data/groups.json"));
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "addgroup",
    args: true,
    help: "Adds groups allowed for the +group command.",
    usage: "<\"groupName\"> [<\"groupAlias\">]+",
    aliases: ["newgroup", "newgame", "addgame"],
    hide: true,
    guildOnly: true,
    modOnly: true,
    botChannelOnly: false,
    inputs: "anything",
    execute: (msg, args, client) => {
        // var group = args.split(" ")[0]
        // MAKE THIS SECTION USE REGEX TO GET `"Group name" "group alias" "group alias"` etc.
        // if (args.split(" ").slice(1)) {
        //     var groupAliases = args.split(" ").slice(1);
        // }

        // if (!Array.from(Object.keys(GROUPS)).includes(group)) {
        //     currGroupAliases = Array.from(GROUPS[command])
        //     groupAliases.forEach(function (alias) {
        //         if (!groupCurrentAliases.includes(alias)) {
        //             groupCurrentAliases.push(alias)
        //         }
        //     });
        //     COMMANDS[command] = currAliases;
        // }

        // fs.writeFile("../data/groups.json", GROUPS, (err) => {
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         var isAre;
        //         if (aliases.length === 1) {
        //             isAre = "is"
        //         } else {
        //             isAre = "are"
        //         }
        //         var aliasesText = `📜 ${aliases.join(" ")} ${isAre} now an alias for ${command}! \`${client.PREFIX} ${command} ${Array.from(COMMANDS[command]).join("|")}\` is now valid.`;
        //         msg.channel.send({
        //             embed: {
        //                 color: client.SUCCESS_COLOUR,
        //                 description: aliasesText
        //             }
        //         });
        //     }
        // });
    }
}