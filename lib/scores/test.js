// Import http
try{
    var http = require('http');
} catch (e) {
    console.log("http missing. Run `npm install` first.");
}

// Import Afterload
try{
    var afterLoad = require('after-load');
} catch (e) {
    console.log("after-load missing. Run `npm install` first.");
}

var getID = (team) => {
    //var httpOptions = {
    //    host: 'dtlive.com.au',
    //    path: '/afl/viewgames.php'
    //};
    //var httpResult = "";
    //var httpRequest = http.request(httpOptions, function (httpResponse) {
    //    console.log(httpResponse.statusCode);
    //    httpResponse.on("data", function (data) {
    //        httpResult += data.toString();
    //    });
    //}).on('error', function(e) {
    //  console.log("Got error: " + e.message);
    //});
    //console.dir(httpResult);

    var page = afterLoad("http://dtlive.com.au/afl/viewgames.php");
    console.dir(page);
    // OLD RUBY CODE
    //games = open("http://dtlive.com.au/afl/viewgames.php").read

    var inProgressGames = page.match(/GameID=(\d+)(?:">[^>]+>\s+([A-Za-z]+\s?[A-Za-z]+)\s+vs[^>]+>\s*([A-Za-z]+\s?[A-Za-z]+).+\(in progress\))/);
    var completedGames = page.match(/GameID=(\d+)(?:">[^>]+>\s+([A-Za-z]+\s?[A-Za-z]+)\s+vs[^>]+>\s*([A-Za-z]+\s?[A-Za-z]+).+\(completed\))/);

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

    var httpOptions = {
        host: 'dtlive.com.au',
        path: '/afl/viewgames.php'
    };
    var httpResult = "";
    var httpRequest = http.request(httpOptions, function (httpResponse) {
        console.log(httpResponse.statusCode);
        httpResponse.on("data", function (data) {
            httpResult += data.toString();
        });
    }).on('error', function(e) {
      console.log("Got error: " + e.message);
    });;
}
getID("Adelaide");