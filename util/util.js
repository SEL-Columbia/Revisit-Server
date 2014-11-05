var SHA2 = new(require('jshashes').SHA512)(),
    crypto = require('crypto');
/**
 * Return a random value for the
 * @param  {[type]} len [description]
 * @return {[type]}     [description]
 */
function randomValueHex(len) {
    try {
        return crypto.randomBytes(Math.ceil(len / 2))
            .toString('hex') // convert to hexadecimal format
            .slice(0, len); // return required number of characters
    } catch (ex) {
        // handle error
        // most likely, entropy sources are drained
        log.error('Error creating salt.', ex);
    }
}

function genHash(pass, salt) {
    return SHA2.b64_hmac(pass, salt);
}

function genSalt() {
    // random str generator
    return randomValueHex(88);
}

// utilities
exports.auth = {
    randomValueHex: randomValueHex,
    genHash: genHash,
    genSalt: genSalt
};