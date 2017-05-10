/*
var TuneIn = requireFromRoot("components/nowplaying/tunein.js")
var NowPlaying = requireFromRoot("components/nowplaying/nowPlayingDatabase.js")

setInterval(function () {
    TuneIn.getAllUsers(function (err, users) {
        if (err) {
            return
        }
        var createCallback = function (user) {
            return function (error, song) {
                if (error || song.length === 0) {
                    return
                }
                TuneIn.sendSong(user.username, song.song, song.artist)
            }
        }
        for (let user of users) {
            NowPlaying.getLatestSong(user.username, createCallback(user))
        }
    })
}, 120000)
*/