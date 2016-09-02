import _ from "underscore";

export const start = (description, data) => {
    let startTime = process.hrtime();
    return {
        end: () => {
            let elapsed = process.hrtime(startTime)[1] / 1000000;
            let duration = parseFloat(process.hrtime(startTime)[0] + "." + elapsed.toFixed(0), 10);
            let message = description + " took " + duration + "s";
            log.debug(_.extend(data, {
                component: "profiler",
                description,
                duration,
            }), message);
        },
        reset: () => {
            startTime = process.hrtime();
        },
    };
};
