// Ported from the old library's uuidService.js. The old one wrapped the `uuid` npm package's v4;
// crypto.randomUUID() is the dependency-free modern equivalent (same UUID v4 output).
const uuidService = {
    newId: function () {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Non-secure-context fallback (crypto.randomUUID needs HTTPS/localhost)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },
};

module.exports = uuidService;
