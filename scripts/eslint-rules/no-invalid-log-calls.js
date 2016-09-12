module.exports = function (context) {
    return {
        "CallExpression": function (node) {
            // log()
            if (node.callee.type === "Identifier" && node.callee.name === "log") {
                context.report(node, "Invalid use of log(). Expected log.METHOD().")
            }
            // req.log()
            if (node.callee.type === "MemberExpression"
                && node.callee.object.type === "Identifier"
                && node.callee.object.name === "req"
                && node.callee.property.type === "Identifier"
                && node.callee.property.name === "log") {
                context.report(node, "Invalid use of req.log(). Expected req.log.METHOD().");
            }
        },
        "MemberExpression": function (node) {
            // res.log
            if (node.object.type === "Identifier"
                && node.object.name === "res"
                && node.property.type === "Identifier"
                && node.property.name === "log") {
                context.report(node, "res.log is not defined. Expected req.log.");
            }
        },
    };
};

module.exports.schema = [{
    type: "array",
    items: {
        type: "string",
    },
}];
