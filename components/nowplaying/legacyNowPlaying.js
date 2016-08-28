import rest from "restler";

import * as usersDatabase from "app/components/legacy/usersDatabase.js";

export const getNowPlayingInfo = (username, callback) => {
    if (!username) {
        return callback(new Error("No username specified"));
    }
    usersDatabase.getInfoForUsername(username, (err, { server } = {}) => {
        if (err) {
            return callback(err);
        }
        if (username === "balochradio") {
            return callback(null, {
                title: "",
                artist: "",
                streamTitle: "Now On Air",
                album: "nocover",
            });
        }
        server = server.toLowerCase();
        let url = `http://${server}.shoutca.st/rpc/${username}/streaminfo.get`;
        rest.get(url, { timeout: 5000 })
            .on("complete", function (data) {
                if (data instanceof Error) {
                    return callback(data);
                }
                try {
                    let title = data.data[0].offline ? "---" : data.data[0].track.title;
                    let artist = data.data[0].offline ? "---" : data.data[0].track.artist;
                    let album = unescape(data.data[0].track.imageurl);
                    let streamTitle = data.data[0].title;
                    return callback(null, {
                        title,
                        artist,
                        album,
                        streamTitle,
                    });
                } catch (_) {
                    return callback(new Error("Failed to parse the data from " + url));
                }
            })
            .on("timeout", function () {
                log.error({ server, url, component: "legacy/now-playing" }, "Request timed out");
                return callback(new Error(`Request to ${server} timed out`));
            });
    });
};
