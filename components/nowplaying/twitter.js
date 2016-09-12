import Twit from "twit";

import * as database from "app/components/nowplaying/twitterDatabase.js";

let moduleLogger = log.child({ component: "twitter" });

export const sendTweet = async (username, songInfo) => {
    let logger = moduleLogger.child({ username });
    try {
        let settings = await database.getSettings(username);
        if (typeof settings._count !== "number") {
            settings._count = 0;
        }
        if (!settings.isEnabled) {
            return logger.debug("Skipping as isEnabled is falsy");
        }
        if (settings.mode === "interval") {
            if ((settings._count + 1) < settings.interval) {
                database.setCount(username, settings._count + 1);
                return;
            }
            database.setCount(username, 0);
        }
        if (settings.mode === "time") {
            let now = Math.round((new Date()).getTime() / 1000);
            let lastSendTime = settings._count;
            let nextSendTime = lastSendTime + settings.interval * 60;
            let intervalHasElapsed = (now > nextSendTime);
            if (!intervalHasElapsed) {
                return;
            }
            database.setCount(username, now);
        }

        let tweet = settings.tweet
            .replace("%title", songInfo.song)
            .replace("%artist", songInfo.artist);
        logger = logger.child({ tweet });
        logger.debug("Sending request");

        new Twit({
            "consumer_key": settings.consumerKey,
            "consumer_secret": settings.consumerSecret,
            "access_token": settings.accessToken,
            "access_token_secret": settings.accessTokenSecret,
        }).post("statuses/update", { status: tweet }, function (error) {
            if (!error) {
                logger.debug("Sent tweet successfully");
                return;
            }

            if (error.message.includes("Status is a duplicate") || error.message.includes("Status is over")) {
                return;
            }

            logger.error({ error: error.message }, "Failed to tweet, got error from Twitter API");

            if (error.message.includes("Application cannot perform write actions")) {
                database.disable(username, "Your token has been banned from sending out Tweets. " +
                    "Please contact Twitter support.");
            }

            if (error.message.includes("Read-only application cannot")) {
                database.disable(username, "You have not allowed us to post on your behalf. " +
                    "Please give write access to the API application.");
            }

            if (error.message.includes("Invalid or expired token")) {
                database.disable(username, "Your token has expired. " +
                    "Please configure the integration with new credentials again.");
            }

            if (error.message.includes("Could not authenticate")) {
                database.disable(username, "Your token is invalid. " +
                    "Please configure the integration with new credentials again.");
            }

        });
    } catch (err) {
        if (err.message !== "Username not in database") {
            logger.error(err);
        }
    }
}
