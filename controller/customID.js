var ObjectId = require('mongoose').Types.ObjectId;

function getCustomID(uuid) {
    var idRegex = new RegExp("^\\w{24}$");
    if (!idRegex.test(uuid)) {
        return false;
    }

    return ObjectId(uuid);
}

module.exports = getCustomID;
