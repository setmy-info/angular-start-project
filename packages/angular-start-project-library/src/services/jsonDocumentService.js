// Ported from the old library's jsonDocumentService.js: loads a JSON document by id
// (json/documents/<id>.json — same URL shape the old app used) and renders it to an HTML string
// via objToDomService; parse() is the reverse direction (rendered DOM back to the JSON document
// format) via domToJsonService. Promise-based instead of the old callback style; goes through
// resourceFactory so the documents can later come from a REST backend.
const resourceFactory = require('../resources/resourceFactory');
const objToDomService = require('./objToDomService');
const domToJsonService = require('./domToJsonService');

const resource = resourceFactory.newResource();

const jsonDocumentService = {
    // Resolves with the document rendered as an HTML string; rejects when the id doesn't exist.
    load: function (id) {
        return resource.getJson('documents/' + id + '.json').then(function (doc) {
            return objToDomService.toHtmlString(doc);
        });
    },

    parse: function (element) {
        return domToJsonService.parse(element);
    }
};

module.exports = jsonDocumentService;
