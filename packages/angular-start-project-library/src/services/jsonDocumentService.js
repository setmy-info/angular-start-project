// LICENSE NOTICE — NOT MIT. This file (together with objToDomService.js and domToJsonService.js:
// the JSON-document format loader/renderer/parser) is proprietary code of the SMI / Hear And See
// Systems (HASS) authors, migrated from the old setmy.info solution. It is NOT covered by the
// MIT license of the surrounding template. The proprietary license text is pending; until it is
// published, external developers need a separate license/permission from the SMI/HASS authors to
// use, copy, or modify this file. See LICENSE-NOTES.md in this package and README.md "Licensing".
//
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
