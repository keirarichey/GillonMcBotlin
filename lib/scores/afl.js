module.exports = {
    main: (bot, msg) => {
        var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam
        if (msg.channel == botChannel) {
            // Import yaml
            try {
                var yaml = require("yamljs");
            } catch (e) {
                console.log("yamljs missing. Run `npm install` first.");
            }

            // Import http
            try{
                var http = require('http');
            } catch (e) {
                console.log("http missing. Run `npm install` first.");
            }

            // Import GilMcBotlin data
            try {
                var teams = yaml.load("../data/teams.yml");
                var teamNames = yaml.load("../data/teamnames.yml");
                var teamEmotes = yaml.load("../data/teamemotes.yml");
            } catch (e) {
                console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
            }

            if (!Object.values(teamNames).includes(msg.content.toLowerCase())) {
                /* If the request team is not a real team (not in teams array) */
                /* The user didn't input a real team, so we will inform them it failured */
                bot.sendNotification(`\<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! \`${msg.content.toLowerCase()}\` is not an accepted input!\nPlease use "+help" or "<@${bot.user.id}> help" for help.`, "error", msg);
                return;
            } else {
                /*  We look into our teams.yml file and find out
                 *  which team corresponds to our argument string.
                 */
                Array.from(Object.keys(teams)).forEach(function(teamName) {
                    if (teams[teamName].includes(msg.content.toLowerCase())) {
                        var newTeam = teamName;
                    } else {
                        return;
                    }
                });
    
                Array.from(Object.keys(teamEmotes)).forEach(function(team) {
                    if (newTeam == team) {
                        var newTeamEmote = teamEmotes[team];
                    }
                });
            }

            var getID = (team) => {
                var htmlOptions = {
                    host: 'dtlive.com.au',
                    path: '/afl/viewgames.php'
                };
                var htmlResult = "";
                var htmlRequest = html.request(htmlOptions, function (htmlResponse) {
                    htmlResponse.on("data", function (data) {
                        htmlResult += data.toString();
                    });
                });

                // OLD RUBY CODE
                //games = open("http://dtlive.com.au/afl/viewgames.php").read

                var inProgressGames = htmlResponse.match(/GameID=(\d+)(?:">[^>]+>\s+([A-Za-z]+\s?[A-Za-z]+)\s+vs[^>]+>\s*([A-Za-z]+\s?[A-Za-z]+).+\(in progress\))/);
                var completedGames = htmlResponse.match(/GameID=(\d+)(?:">[^>]+>\s+([A-Za-z]+\s?[A-Za-z]+)\s+vs[^>]+>\s*([A-Za-z]+\s?[A-Za-z]+).+\(completed\))/);

                // OLD RUBY CODE
                //in_progress = games.scan(/GameID=(\d+)(?:">[^>]+>\s+([A-Za-z]+\s?[A-Za-z]+)\s+vs[^>]+>\s*([A-Za-z]+\s?[A-Za-z]+).+\(in progress\))/)
                //completed = games.scan(/GameID=(\d+)(?:">[^>]+>\s+([A-Za-z]+\s?[A-Za-z]+)\s+vs[^>]+>\s*([A-Za-z]+\s?[A-Za-z]+).+\(completed\))/)

                if (inProgressGames.flatten().includes(team)) {
                    var gameID = inProgressGames.find(function (element) {
                        element.includes(team);
                    });
                } else if (completedGames.flatten().includes(team)) {
                    var gameID = completedGames.find(function (element) {
                        element.includes(team);
                    });
                }

                // OLD RUBY CODE
                //if in_progress.flatten.include?(team)
                //    gameid = in_progress.find { |a| a.include? team }.first
                //elsif completed.flatten.include?(team)
                //    completed_ordered_whitespace = completed.sort_by { |number,| number.to_i }.reverse # sort completed matches by ID sequential order
                //    completed_ordered_whitespace.each &:compact! # remove nil elements
                //    completed_ordered_no_whitespace = completed_ordered_whitespace.collect{ |arr| arr.collect{|x| x.strip } } # remove whitespace
                //    gameid_i = completed_ordered_no_whitespace.find { |a| a.include? team }.first # find user team
                //    gameid = gameid_i.to_s # convert back to string

                return gameID;
            }

            var processFeed = (team) => {
                var gameID = getID(team);
                var data = {}
                var result = {}

                var htmlOptions = {
                    host: 'dtlive.com.au',
                    path: '/afl/viewgames.php'
                };
                var htmlResult = "";
                var htmlRequest = html.request(htmlOptions, function (htmlResponse) {
                    htmlResponse.on("data", function (data) {
                        htmlResult += data.toString();
                    });
                });

                
            }
        }
    }
}