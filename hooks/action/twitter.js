let twitter = requireFromRoot("components/nowplaying/twitter.js")

global.hooks.add("newSong", function sendTweetOnSong(meta) {
    twitter.sendTweet(meta.username, {
        song: meta.song,
        artist: meta.artist,
    });
});
