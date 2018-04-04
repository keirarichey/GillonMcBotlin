//// Import cheerio
//try{
//    var cheerio = require('cheerio');
//} catch (e) {
//    console.log("cheerio missing. Run `npm install` first.");
//}
//
//// Import rp
//try{
//    var rp = require('request-promise');
//} catch (e) {
//    console.log("request-promise missing. Run `npm install` first.");
//}
//
//// Import xmldom
//try{
//    var xmldom = require('xmldom').DOMParser;
//} catch (e) {
//    console.log("xmldom missing. Run `npm install` first.");
//}
//
//// Import yaml
//try {
//    var yaml = require("yamljs");
//} catch (e) {
//    console.log("yamljs missing. Run `npm install` first.");
//}
//
//// Import GilMcBotlin data
//try {
//    var teams = yaml.load("../../data/teams.yml");
//    var teamNames = yaml.load("../../data/teamnames.yml");
//    var teamEmotes = yaml.load("../../data/teamemotes.yml");
//} catch (e) {
//    console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
//}
//
//var getMatches = (str, regex) => {
//    var matchArray = [];
//    var match;
//    while ((match = regex.exec(str)) !== null) {
//        matchArray.push(match.slice(0,-2));
//    }
//    return matchArray;
//}
//
//var getID = (team) => {
//
//    const options = {
//        uri: `http://dtlive.com.au/afl/viewgames.php`,
//        transform: function (body) {
//            return cheerio.load(body);
//        }
//    };
//
//    return rp(options)
//    .then(function (data) {
//        data('nav').remove();
//        var page = data('.container').html();
//
//        inProgressRegex = /GameID=(\d+)">[^>]+>\s+(?:([A-Za-z ]+[^<]+)\s+vs[^>]+>\s*([^>]+)|([^>]+)\s+vs[^>]+>\s*([A-Za-z ]+[^<]+))<small>\(in progress\)/g;
//        inProgressGames = getMatches(page, inProgressRegex);
//        for (var i = 0; i < inProgressGames.length; i++) {
//            for (var j = 0; j < inProgressGames[i].length; j++) {
//                inProgressGames[i][j] = inProgressGames[i][j].trim();
//            }
//        }
//        
//
//        completedRegex = /GameID=(\d+)">[^>]+>\s+(?:([A-Za-z ]+[^<]+)\s+vs[^>]+>\s*([^>]+)|([^>]+)\s+vs[^>]+>\s*([A-Za-z]+[^<]+))<small>\(completed\)/g;
//        completedGames = getMatches(page, completedRegex);
//        for (var i = 0; i < completedGames.length; i++) {
//            for (var j = 0; j < completedGames[i].length; j++) {
//                completedGames[i][j] = completedGames[i][j].trim();
//            }
//        }
//
//        for (var i = 0; i < inProgressGames.length; i++) {
//            if (inProgressGames[i].includes(team)) {
//                var gameID = inProgressGames[i][1];
//                return gameID;
//            }
//        }
//
//        for (var i = 0; i < completedGames.length; i++) {
//            if (completedGames[i].includes(team)) {
//                var gameID =  completedGames[i][1];
//                return gameID;
//            }
//        }
//    })
//    .catch(function (err) {
//        console.log(err);
//    });
//}
//
//var processFeed = (team) => {
//    return getID(team)
//    .then(function(gameID) {
//        const options = {
//            uri: `http://dtlive.com.au/afl/xml/${gameID}.xml`,
//            xmlMode: true,
//            transform: function (body) {
//                return cheerio.load(body);
//            }
//        };
//        return rp(options)
//        .then(function (data) {
//            var matchData = {};
//            var matchResult = {};
//            var page = data("xml").html();
//            var doc = new xmldom().parseFromString(page, "text/xml");
//        
//            matchData.location = doc.getElementsByTagName("location")[0].childNodes[0].nodeValue;
//            matchData.currentQuarter = doc.getElementsByTagName("currentquarter")[0].childNodes[0].nodeValue;
//            matchData.currentTime = doc.getElementsByTagName("currenttime")[0].childNodes[0].nodeValue;
//            matchData.percComplete = doc.getElementsByTagName("perccomplete")[0].childNodes[0].nodeValue;
//            matchData.homeTeam = doc.getElementsByTagName("hometeam")[0].childNodes[0].nodeValue;
//            matchData.homeTeamShort = doc.getElementsByTagName("hometeamshort")[0].childNodes[0].nodeValue;
//            matchData.awayTeam = doc.getElementsByTagName("awayteam")[0].childNodes[0].nodeValue;
//            matchData.awayTeamShort = doc.getElementsByTagName("awayteamshort")[0].childNodes[0].nodeValue;
//            matchData.homeGoals = doc.getElementsByTagName("hometeamgoal")[0].childNodes[0].nodeValue;
//            matchData.homeBehinds = doc.getElementsByTagName("hometeambehind")[0].childNodes[0].nodeValue;
//            matchData.homeTotal = (6 * parseInt(matchData.homeGoals) + parseInt(matchData.homeBehinds)).toString();
//            matchData.awayGoals = doc.getElementsByTagName("awayteamgoal")[0].childNodes[0].nodeValue;
//            matchData.awayBehinds = doc.getElementsByTagName("awayteambehind")[0].childNodes[0].nodeValue;
//            matchData.awayTotal = (6 * parseInt(matchData.awayGoals) + parseInt(matchData.awayBehinds)).toString();
//
//            switch (matchData.percComplete) {
//                case "100":
//                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - Game Finished`;
//                    break;
//                case "75":
//                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - End of Q#${matchData.currentQuarter}`;
//                    break;
//                case "50":
//                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - Half Time`;
//                    break;
//                case "25":
//                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - End of Q#${matchData.currentQuarter}`;
//                    break;
//                default:
//                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - Game time: ${matchData.currentTime} in Q#${matchData.currentQuarter}`;
//            }
//        
//            matchResult.final2 = `${matchData.homeTeam} ${matchData.homeGoals}.${matchData.homeBehinds}.${matchData.homeTotal} - ${matchData.awayTeam} ${matchData.awayGoals}.${matchData.awayBehinds}.${matchData.awayTotal}`;
//        
//            if (parseInt(matchData.homeTotal) === parseInt(matchData.awayTotal)) {
//                matchData.margin = "0";
//                matchResult.final3 = "*Scores level.*";
//            } else if (parseInt(matchData.homeTotal) > parseInt(matchData.awayTotal)) {
//                matchData.margin = (parseInt(matchData.homeTotal) - parseInt(matchData.awayTotal)).toString();
//                matchResult.final3 = `*${matchData.homeTeamShort} by ${matchData.margin}*`;
//            } else if (parseInt(matchData.homeTotal) < parseInt(matchData.awayTotal)) {
//                matchData.margin = (parseInt(matchData.awayTotal) - parseInt(matchData.homeTotal)).toString();
//                matchResult.final3 = `*${matchData.awayTeamShort} by ${matchData.margin}*`;
//            }
//        
//            matchResult.final = `${matchResult.final1}\n${matchResult.final2}\n${matchResult.final3}`;
//            return matchResult;
//        });
//    });
//}
////EG
//processFeed("Richmond").then(function(results) {
//    console.log(results);
//});

/* NOW.JS
*/
// Import cheerio
//try{
//    var cheerio = require('cheerio');
//} catch (e) {
//    console.log("cheerio missing. Run `npm install` first.");
//}
//
//// Import rp
//try{
//    var rp = require('request-promise');
//} catch (e) {
//    console.log("request-promise missing. Run `npm install` first.");
//}
//
//// Import xmldom
//try{
//    var xmldom = require('xmldom').DOMParser;
//} catch (e) {
//    console.log("xmldom missing. Run `npm install` first.");
//}
//
//// Import yaml
//try {
//    var yaml = require("yamljs");
//} catch (e) {
//    console.log("yamljs missing. Run `npm install` first.");
//}
//
//// Import GilMcBotlin data
//try {
//    var teams = yaml.load("../../data/teams.yml");
//    var teamNames = yaml.load("../../data/teamnames.yml");
//    var teamEmotes = yaml.load("../../data/teamemotes.yml");
//} catch (e) {
//    console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
//}
//
//var getMatches = (str, regex) => {
//    var matchArray = [];
//    var match;
//    while ((match = regex.exec(str)) !== null) {
//        matchArray.push(match.slice(0,-2));
//    }
//    return matchArray;
//}
//
//var getInProgress = () => {
//    const options = {
//        uri: `http://dtlive.com.au/afl/viewgames.php`,
//        transform: function (body) {
//            return cheerio.load(body);
//        }
//    };
//
//    return rp(options)
//    .then(function (data) {
//        data('nav').remove();
//        var page = data('.container').html();
//
//        inProgressRegex = /GameID=(\d+)">[^>]+>\s+(?:([A-Za-z ]+[^<]+)\s+vs[^>]+>\s*([^>]+)|([^>]+)\s+vs[^>]+>\s*([A-Za-z ]+[^<]+))<small>\(in progress\)/g;
//        inProgressGames = getMatches(page, inProgressRegex);
//
//        if (inProgressGames.length === 0) {
//            console.log("Sorry, no games are on! <:vicbias:275912832992804865>");
//            return null;
//        } else {
//            inProgressIDs = [];
//            for (var i = 0; i < inProgressGames.length; i++) {
//                inProgressIDs.push(inProgressGames[i][1]);
//            }
//            return inProgressIDs;
//        }
//    })
//    .catch(function (err) {
//        console.log(err);
//    });
//}
//
//var processInProgress = () => {
//    return getInProgress()
//    .then(function(idList) {
//        if (idList === null) {
//            return null;
//        }
//        gameTracker = [];
//        idList.forEach(function (id) {
//            const options = {
//                uri: `http://dtlive.com.au/afl/xml/${id}.xml`,
//                xmlMode: true,
//                transform: function (body) {
//                    return cheerio.load(body);
//                }
//            };
//            return rp(options)
//            .then(function (data) {
//                var matchData = {};
//                var page = data("xml").html();
//                var doc = new xmldom().parseFromString(page, "text/xml");
//            
//                matchData.location = doc.getElementsByTagName("location")[0].childNodes[0].nodeValue;
//                matchData.currentQuarter = doc.getElementsByTagName("currentquarter")[0].childNodes[0].nodeValue;
//                matchData.currentTime = doc.getElementsByTagName("currenttime")[0].childNodes[0].nodeValue;
//                matchData.percComplete = doc.getElementsByTagName("perccomplete")[0].childNodes[0].nodeValue;
//                matchData.homeTeam = doc.getElementsByTagName("hometeam")[0].childNodes[0].nodeValue;
//                matchData.homeTeamShort = doc.getElementsByTagName("hometeamshort")[0].childNodes[0].nodeValue;
//                matchData.awayTeam = doc.getElementsByTagName("awayteam")[0].childNodes[0].nodeValue;
//                matchData.awayTeamShort = doc.getElementsByTagName("awayteamshort")[0].childNodes[0].nodeValue;
//                matchData.homeGoals = doc.getElementsByTagName("hometeamgoal")[0].childNodes[0].nodeValue;
//                matchData.homeBehinds = doc.getElementsByTagName("hometeambehind")[0].childNodes[0].nodeValue;
//                matchData.homeTotal = (6 * parseInt(matchData.homeGoals) + parseInt(matchData.homeBehinds)).toString();
//                matchData.awayGoals = doc.getElementsByTagName("awayteamgoal")[0].childNodes[0].nodeValue;
//                matchData.awayBehinds = doc.getElementsByTagName("awayteambehind")[0].childNodes[0].nodeValue;
//                matchData.awayTotal = (6 * parseInt(matchData.awayGoals) + parseInt(matchData.awayBehinds)).toString();
//
//                gameTracker.push(matchData);
//            })
//        })
//
//        result = "";
//        gameTracker.forEach(function (matchData) {
//            switch (matchData.percComplete) {
//                case "100":
//                    matchResult.status = `Game Finished`;
//                    break;
//                case "75":
//                    matchResult.status = `End of Q#${matchData.currentQuarter}`;
//                    break;
//                case "50":
//                    matchResult.status = `Half Time`;
//                    break;
//                case "25":
//                    matchResult.status = `End of Q#${matchData.currentQuarter}`;
//                    break;
//                default:
//                    matchResult.status = `Game time: ${matchData.currentTime} in Q#${matchData.currentQuarter}`;
//            }
//
//            if (parseInt(matchData.homeTotal) === parseInt(matchData.awayTotal)) {
//                matchData.margin = "0";
//                matchData.finalMargin = "*Scores level.*";
//            } else if (parseInt(matchData.homeTotal) > parseInt(matchData.awayTotal)) {
//                matchData.margin = (parseInt(matchData.homeTotal) - parseInt(matchData.awayTotal)).toString();
//                matchData.finalMargin = `*${matchData.homeTeamShort} by ${matchData.margin}*`;
//            } else if (parseInt(matchData.homeTotal) < parseInt(matchData.awayTotal)) {
//                matchData.margin = (parseInt(matchData.awayTotal) - parseInt(matchData.homeTotal)).toString();
//                matchData.finalMargin = `*${matchData.awayTeamShort} by ${matchData.margin}*`;
//            }
//            result += `**${matchData.homeTeam}** vs **${matchData.awayTeam} at ${matchData.location} | ${matchData.status} | ${matchData.homeTeam} ${matchData.homeGoals}.${matchData.homeBehinds}.${matchData.homeTotal} - ${matchData.awayTeam} ${matchData.awayGoals}.${matchData.awayBehinds}.${matchData.awayTotal} | ${matchData.finalMargin}\n`
//        });
//        return result;
//    });
//}
//
//processInProgress().then(function(result) {
//    console.log(result);
//});

/*
 *    TOPTEN.JS
 */
// Import cheerio
//try{
//    var cheerio = require('cheerio');
//} catch (e) {
//    console.log("cheerio missing. Run `npm install` first.");
//}
//
//// Import rp
//try{
//    var rp = require('request-promise');
//} catch (e) {
//    console.log("request-promise missing. Run `npm install` first.");
//}
//
//// Import xmldom
//try{
//    var xmldom = require('xmldom').DOMParser;
//} catch (e) {
//    console.log("xmldom missing. Run `npm install` first.");
//}
//
//// Import yaml
//try {
//    var yaml = require("yamljs");
//} catch (e) {
//    console.log("yamljs missing. Run `npm install` first.");
//}
//
//// Import GilMcBotlin data
//try {
//    var teams = yaml.load("../../data/teams.yml");
//    var teamNames = yaml.load("../../data/teamnames.yml");
//    var teamEmotes = yaml.load("../../data/teamemotes.yml");
//} catch (e) {
//    console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
//}
//
//teams["GWS Giants"] = teams["GWS"];
//teamEmotes["GWS Giants"] = teamEmotes["GWS"];
//
//var getMatches = (str, regex) => {
//    var matchArray = [];
//    var match;
//    while ((match = regex.exec(str)) !== null) {
//        matchArray.push(match.slice(0,-2));
//    }
//    return matchArray;
//}
//
//var getGameInfo = (team) => {
//    
//    team = team.toLowerCase();
//
//    /*  We look into our teams.yml file and find out
//     *  which team corresponds to our argument string.
//     */
//    Array.from(Object.keys(teams)).forEach(function(teamName) {
//        if (teams[teamName].includes(team)) {
//            team = teamName;
//        }
//    });
//
//    const options = {
//        uri: `http://dtlive.com.au/afl/viewgames.php`,
//        transform: function (body) {
//            return cheerio.load(body);
//        }
//    };
//
//    return rp(options)
//    .then(function (data) {
//        data('nav').remove();
//        var page = data('.container').html();
//
//        allGamesRegex = /GameID=(\d+)">[^>]+>\s+(?:([A-Za-z ]+[^<]+)\s+vs[^>]+>\s*([^>]+)|([^>]+)\s+vs[^>]+>\s*([A-Za-z]+[^<]+))<small>(?:(?:\(completed\))|(?:\(in progress\)))/g;
//        allGames = getMatches(page, allGamesRegex);
//
//        for (var i = 0; i < allGames.length; i++) {
//            for (var j = 0; j < allGames[i].length; j++) {
//                allGames[i][j] = allGames[i][j].trim();
//            }
//        }
//
//        var foundGame = allGames.find(function (game) {
//            if (game.includes(team)) {
//                return game;
//            }
//        });
//
//        var gameInfo = {};
//        gameInfo.gameID = foundGame[1];
//        gameInfo.homeTeam = foundGame[2];
//        gameInfo.awayTeam = foundGame[3];
//
//        return gameInfo;
//    })
//    .catch(function (err) {
//        console.log(err);
//    });
//}
//
//var getStats = (team) => {
//    return getGameInfo(team)
//    .then(function(gameInfo) {
//        const options = {
//            uri: `http://dtlive.com.au/afl/xml/${gameInfo.gameID}.xml`,
//            xmlMode: true,
//            transform: function (body) {
//                return cheerio.load(body);
//            }
//        };
//        return rp(options)
//        .then(function (data) {
//            var stats = [];
//            var page = data("xml").html();
//            var doc = new xmldom().parseFromString(page, "text/xml");
//
//            var homeStats = doc.getElementsByTagName("home")[0];
//            var awayStats = doc.getElementsByTagName("away")[0];
//
//            for (var i = 0; i < homeStats.getElementsByTagName("player").length; i++) {
//                
//                playerStats = {};
//                
//                playerStats.id = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("playerid")[0].childNodes[0].nodeValue);
//                playerStats.name = homeStats.getElementsByTagName("player")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
//                playerStats.team = gameInfo.homeTeam;
//                playerStats.number = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("jumpernumber")[0].childNodes[0].nodeValue);
//                try {
//                    playerStats.disposals = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("kick")[0].childNodes[0].nodeValue) + parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("handball")[0].childNodes[0].nodeValue);
//                    playerStats.goals = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("goal")[0].childNodes[0].nodeValue);
//                    playerStats.behinds = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("behind")[0].childNodes[0].nodeValue);
//                    playerStats.dt = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("dt")[0].childNodes[0].nodeValue);
//                } catch (e) {
//                    playerStats.disposals = 0;
//                    playerStats.goals = 0;
//                    playerStats.behinds = 0;
//                    playerStats.dt = 0;
//                }
//                stats.push(playerStats);
//            }
//
//            for (var i = 0; i < awayStats.getElementsByTagName("player").length; i++) {
//
//                playerStats = {};
//
//                playerStats.id = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("playerid")[0].childNodes[0].nodeValue);
//                playerStats.name = awayStats.getElementsByTagName("player")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
//                playerStats.team = gameInfo.awayTeam;
//                playerStats.number = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("jumpernumber")[0].childNodes[0].nodeValue);
//                try {
//                    playerStats.disposals = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("kick")[0].childNodes[0].nodeValue) + parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("handball")[0].childNodes[0].nodeValue);
//                    playerStats.goals = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("goal")[0].childNodes[0].nodeValue);
//                    playerStats.behinds = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("behind")[0].childNodes[0].nodeValue);
//                    playerStats.dt = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("dt")[0].childNodes[0].nodeValue);
//                } catch (e) {
//                    playerStats.disposals = 0;
//                    playerStats.goals = 0;
//                    playerStats.behinds = 0;
//                    playerStats.dt = 0;
//                }
//
//                stats.push(playerStats);
//            }
//
//            return stats;
//        });
//    });
//}
//
//getStats("Sydney").then(function(result) {
//    console.log(result);
//});