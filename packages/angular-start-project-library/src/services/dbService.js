// IndexedDB service — promise-based rework of the old library's dbService.js (which was a
// callback/onupgradeneeded skeleton around a database named HASDB with commented-out CRUD
// examples). Provided for later usage: nothing in the template calls it yet. A single generic
// key-value object store keeps the API simple; add dedicated stores via the upgrade callback in
// open() when a real use case appears.
const DB_NAME = 'HASDB';
const DB_VERSION = 1;
const DEFAULT_STORE = 'keyValue';

function requestToPromise(request) {
    return new Promise(function (resolve, reject) {
        request.onsuccess = function () {
            resolve(request.result);
        };
        request.onerror = function () {
            reject(request.error);
        };
    });
}

const dbService = {
    DB_NAME: DB_NAME,
    DEFAULT_STORE: DEFAULT_STORE,
    db: null,

    // Resolves with the open IDBDatabase (cached after the first call).
    open: function () {
        if (this.db) {
            return Promise.resolve(this.db);
        }
        const that = this;
        return new Promise(function (resolve, reject) {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('IndexedDB is not available in this environment'));
                return;
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function () {
                const db = request.result;
                if (!db.objectStoreNames.contains(DEFAULT_STORE)) {
                    db.createObjectStore(DEFAULT_STORE);
                }
            };
            request.onsuccess = function () {
                that.db = request.result;
                resolve(that.db);
            };
            request.onerror = function () {
                reject(request.error);
            };
        });
    },

    put: function (key, value) {
        return this.open().then(function (db) {
            const store = db.transaction(DEFAULT_STORE, 'readwrite').objectStore(DEFAULT_STORE);
            return requestToPromise(store.put(value, key));
        });
    },

    get: function (key) {
        return this.open().then(function (db) {
            const store = db.transaction(DEFAULT_STORE, 'readonly').objectStore(DEFAULT_STORE);
            return requestToPromise(store.get(key));
        });
    },

    getAllKeys: function () {
        return this.open().then(function (db) {
            const store = db.transaction(DEFAULT_STORE, 'readonly').objectStore(DEFAULT_STORE);
            return requestToPromise(store.getAllKeys());
        });
    },

    delete: function (key) {
        return this.open().then(function (db) {
            const store = db.transaction(DEFAULT_STORE, 'readwrite').objectStore(DEFAULT_STORE);
            return requestToPromise(store.delete(key));
        });
    },

    clear: function () {
        return this.open().then(function (db) {
            const store = db.transaction(DEFAULT_STORE, 'readwrite').objectStore(DEFAULT_STORE);
            return requestToPromise(store.clear());
        });
    },

    close: function () {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
};

module.exports = dbService;
