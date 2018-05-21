"use strict";

require("dotenv").config();
var request = require("request");
var fs = require("fs");
var Twitter = require('twitter');
var Spotify = require('node-spotify-api');
var inquirer = require("inquirer");
var keys = require("./keys.js");
var fromRandom;

var twitterApi = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var spotifyApi = new Spotify({
    id: process.env.SPOTIFY_ID,
    secret: process.env.SPOTIFY_SECRET,
  });

var getTweets = function(argument) {
    var params = {screen_name: argument, count: 20};
    twitterApi.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (!error) {
            var twitterResponse = JSON.parse(response.body);

            if (!twitterResponse[0]) {
                console.log ("This user has not tweeted.  Please try searching for someone else!");
                console.log("\nCould I help you with something else today?");
                liriStart();
            }
            else {
                console.log("Retrieving last 20 tweets from Twitter user " + twitterResponse[0].user.screen_name + "...");
                console.log("");

                for (var i = 0; i < twitterResponse.length; i++) {
                    console.log("Tweet #" + (i+1) + " by " + twitterResponse[i].user.name + " (" + twitterResponse[i].user.screen_name + ")");
                    console.log("Tweeted on: " + twitterResponse[i].created_at);
                    console.log(twitterResponse[i].text);
                    console.log("------------------------------------------------------------");
                };
                console.log("\nCould I help you with something else today?");
                liriStart();
            };
        }
        else if (error) {
            console.log("Error code " + error[0].code + " has occurred: '" + error[0].message + "'");
            console.log("\nCould I help you with something else today?");
            liriStart();
        };
    });
};

var getSpotify = function(argument) {
    spotifyApi
    .request('https://api.spotify.com/v1/search?q=' + argument + "&type=track")
    .then(function(data) {
        var spotifyData = data.tracks;

        if (!spotifyData.total) {
            console.log("No results found.  Please revise your search and try again.");
        }
        else {
            for (var i = 0; i < spotifyData.items.length; i++) {
                console.log("Result #" + (i+1) + "...");
                var artists = "";
                for (var j = 0; j < spotifyData.items[i].artists.length; j++) {
                    artists += spotifyData.items[i].artists[j].name + ", ";
                };
                artists = artists.slice(0,(artists.length-2)); // remove the trailing comma space (", ") coming from the for loop
                console.log("Artist(s): " + artists);
                console.log("Track name: " + spotifyData.items[i].name);
                if (spotifyData.items[i].preview_url) {
                    console.log("Preview link: " + spotifyData.items[i].preview_url);
                }
                else {
                    console.log("Sorry, no preview URL available.");
                };
                console.log("Album: " + spotifyData.items[i].album.name);
                console.log("------------------------------------------------------------");

            };
            console.log("\nCould I help you with something else today?");
            liriStart();
        };
    })
    .catch(function(err) {
        console.error('Error occurred: ' + err);
        console.log("\nCould I help you with something else today?");
        liriStart();
    });
};

var movieSearch = function(argument) {
    request("http://www.omdbapi.com/?t=" + argument + "&y=&plot=short&apikey=trilogy", function(error, response, body) {
        // If the request is successful (i.e. if the response status code is 200)
        if (!error && response.statusCode === 200) {
            var omdbResponse = JSON.parse(body);
            if (omdbResponse.Response === "False") {
                console.log("Sorry, movie not found.  Please revise your search and try again.  Note that OMDb search is very picky!");
                console.log("\nCould I help you with something else today?");
                liriStart();
            }
            else {
                console.log("Movie title: " + omdbResponse.Title);
                console.log("Year: " + omdbResponse.Year);
                console.log(omdbResponse.Ratings[0].Source + " rating: " + omdbResponse.Ratings[0].Value);
                console.log(omdbResponse.Ratings[1].Source + " rating: " + omdbResponse.Ratings[1].Value);
                console.log("Country of origin: " + omdbResponse.Country);
                console.log("Language: " + omdbResponse.Language);
                console.log("Plot: " + omdbResponse.Plot);
                console.log("Actors: " + omdbResponse.Actors);
                console.log("\nCould I help you with something else today?");
                liriStart();
            };
        };
    });
};

var tweetFollowUp = function() {
    inquirer
    .prompt([
    {
        type: "input",
        message: "Please enter the Twitter username you'd like to look up.\n",
        name: "tweet"
    }])
    .then(answers => {
        if (!answers.tweet) {
            console.log("You didn't enter anything.  Try again!");
            tweetFollowUp();
        }
        else {
            getTweets(answers.tweet);
        };
    });
};

var spotifyFollowUp = function() {
    inquirer
    .prompt([
    {
        type: "input",
        message: "Please enter the song you'd like to look up.\n",
        name: "song"
    }])
    .then(answers => {
        if (!answers.song) {
            console.log("You didn't enter anything.  I'll pull up info about Ace of Base's The Sign.  You're welcome!");
            getSpotify("Ace of Base The Sign");
        }
        else {
            getSpotify(answers.song);
        };
    });
};

var movieFollowUp = function() {
    inquirer
    .prompt([
    {
        type: "input",
        message: "Please enter the movie you'd like to look up.\n",
        name: "movie"
    }])
    .then(answers => {
        if (!answers.movie) {
            console.log("You didn't enter anything.  I'll pull up info about Mr. Nobody.  You're welcome!");
            movieSearch("Mr. Nobody");
        }
        else {
            movieSearch(answers.movie);
        };
    });
};

var liriStart = function() {
    inquirer
    .prompt([
        {
            type: "list",
            message: "How may I help you?",
            choices: ["Look up someone's tweets",
            "Look up a song on Spotify",
            "Look up information about a movie",
            "Cancel and quit"],
            name: "watDo"
        }
    ])
    .then(answers => {
        if (answers.watDo === "Look up someone's tweets") {
            tweetFollowUp();
        }
        else if (answers.watDo === "Look up a song on Spotify") {
            spotifyFollowUp();
        }
        else if (answers.watDo === "Look up information about a movie") {
            movieFollowUp();
        }
        else {
            console.log("See you later!");
        };
    });
};
console.log("Hello!  I'm Liri!");
liriStart();