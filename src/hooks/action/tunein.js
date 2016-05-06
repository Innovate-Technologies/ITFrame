var tuneIn = requireFromRoot("components/nowplaying/tunein.js")

global.hooks.add("newSong", function (meta) {
    tuneIn.sendSong(meta.username, meta.song, meta.artist)
});
