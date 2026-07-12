// LICENSE NOTICE — NOT MIT. This file (the HTML/DOM → JSON-document parser, together with
// objToDomService.js and jsonDocumentService.js) is proprietary code of the SMI / Hear And See
// Systems (HASS) authors, migrated from the old setmy.info solution. It is NOT covered by the
// MIT license of the surrounding template. The proprietary license text is pending; until it is
// published, external developers need a separate license/permission from the SMI/HASS authors to
// use, copy, or modify this file. See LICENSE-NOTES.md in this package and README.md "Licensing".

const objToDomService = require('./objToDomService');

const whiteOnly = function (str) {
    if (/\S/.test(str)) {
        // string is not empty and not just whitespace
        return false;
    }
    return true;
};

const attrNameToBooleanVar = {
    align: ["center", "left", "right"]
};

const attrNameToValueTranslation = {
    color: "color",
    href: "linkFollow"
};

const tagToBooleanValueTranslation = {
    strong: "bold",
    u: "underline",
    b: "bold",
    i: "italic",
    del: "strike",
    mark: "marked",
    em: "italic",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6"
};

const domToJsonService = {

    /**
     * TODO : problem with overline parsing. style="text-decoration:overline;"
     * */

    parse: function (element) {
        return JSON.stringify(this.getData(element));
    },

    getData: function (element) {
        var stageObject = this.newStageObject();
        stageObject.init();
        var result = this.parseElement(element, 0, [], stageObject);
        stageObject.finish();
        var data = result.getData();
        return data;
    },

    newStageObject: function () {
        return {
            data: {}, //
            stylesObject: {}, //--- DOM Parsing styles
            attributes: {}, //--- DOM node attributes
            fragments: [], //--- DOM parsing fragments, parts, and fragment meta
            parts: [], //--- Parsed parts
            fragmentMeta: [],
            currentPart: null,
            newPart: function () {
                return {
                    from: -1,
                    to: -1
                };
            },
            headingSize: function (element) {
                var lowerCaseName = element.nodeName.toLowerCase();
                lowerCaseName = lowerCaseName.substring(1, 2);
                return parseInt(lowerCaseName);
            },
            isHeading: function (element) {
                var lowerCaseName = element.nodeName.toLowerCase();
                var pat = new RegExp("h[1-6]", "i");
                if (pat.test(lowerCaseName)) {
                    return true;
                }
                return false;
            },
            isParagraph: function (element) {
                var lowerCaseName = element.nodeName.toLowerCase();
                if ("p" === lowerCaseName) {
                    return true;
                }
                return false;
            },
            isCurrentPartExisting: function () {
                return !!(this.currentPart);
            },
            partHaveElements: function () {
                if ((this.currentPart.to - this.currentPart.from) >= 1) {
                    return true;
                }
                return false;
            },
            isFirstPart: function () {
                if (this.parts.length > 0) {
                    return false;
                }
                return true;
            },
            addPart: function (part) {
                this.parts.push(part);
            },
            addFragment: function (fragment, props) {
                this.appendableFragmentNumber = this.fragments.length;
                this.fragments.push(fragment);
                this.fragmentMeta.push(props);
            },
            markCitation: function () {
                this.currentPart.citation = true;
            },
            finish: function () {
                this.currentPart.to = this.fragments.length - 1;
            },
            getData: function () {
                var ret = {};
                ret.documentMetaData = this.data.documentMetaData;
                ret.sequentialContent = this.fragments;
                ret.sequentialContentMetaData = this.fragmentMeta;
                ret.partsMetaData = this.parts;
                return ret;
            },
            init: function () {
                this.currentPart = this.newPart();
                this.currentPart.from = 0;
                this.addPart(this.currentPart);
            },
            appendableFragmentNumber: -1, // All continued text nodes are merged into one
            doTextNode: function (element, levelNumber, nodeNames, currentTagName, props) {
                if (element.data) {
                    var beforeTrim = element.data;
                    var trimmed = beforeTrim;
                    if (this.appendableFragmentNumber >= 0) {// Continous and not firs text part
                        if (whiteOnly(beforeTrim)) {
                            var tmp = this.fragments[this.appendableFragmentNumber];
                            this.fragments[this.appendableFragmentNumber] = tmp + beforeTrim;
                            trimmed = beforeTrim.trim();
                        }
                    }
                    if (trimmed && trimmed.length > 0) {
                        this.addFragment(trimmed, props);
                        this.currentPart.to = this.fragments.length - 1;
                    }
                }
            },
            preHtmlNode: function (element, levelNumber, nodeNames, currentTagName) {
                this.appendableTextNode = -1;
            },
            finishPart: function () {
                this.currentPart.to = this.fragments.length - 1;
            },
            startPart: function () {
                this.currentPart = this.newPart();
                this.currentPart.from = this.fragments.length;
                this.addPart(this.currentPart);
            },
            doHtmlNode: function (element, levelNumber, nodeNames, currentTagName) {
                if (this.isHeading(element) || this.isParagraph(element)) {
                    if (this.partHaveElements()) {
                        this.finishPart();
                        this.startPart();
                    } else {
                        // Continue with part
                    }
                }
            }
        };
    },

    // Recursive node parsing - first work, then recursive subnodes.
    parseElement: function (element, levelNumber, nodeNames, stageObject) {
        if (!element) {
            return null;
        }
        var currentTagName = "";
        if (typeof element.nodeName !== 'undefined') {
            currentTagName = element.nodeName.toLowerCase();
        }
        // Get current node data.
        if (element.nodeType === 3) { // Text node
            stageObject.doTextNode(element, levelNumber, nodeNames, currentTagName, this.getTextNodeProperties(element, nodeNames, stageObject));
        } else if (element.nodeType === 1) { // Any HTML node (H, DIV, LABEL, ...)
            stageObject.preHtmlNode(element, levelNumber, nodeNames, currentTagName);
            stageObject.doHtmlNode(element, levelNumber, nodeNames, currentTagName);
            // Parse all childnodes
            for (var pos = 0; pos < element.childNodes.length; pos++) {// Text node doestn have subs - it is HTML tag node element
                var newArray = nodeNames.slice(0);// Clone nodeNames - copy array into new one
                newArray[newArray.length] = currentTagName;//Add current tag name
                var result = this.getTagNodeProperties(element, nodeNames, stageObject);
                this.parseElement(element.childNodes[pos], levelNumber + 1, newArray, stageObject);
                // Set back temp from properties collector function
                stageObject.stylesObject = result.stylesObject;
                stageObject.attributes = result.attributes;
            }
        }
        return stageObject;
    },

    // Parsing: get tag properties: style and attributes before it will be processed by text node.
    getTagNodeProperties: function (element, nodeNames, stageObject) {
        if (!element || element.nodeType !== 1) {// Any HTML node : DIV, ...
            return null;
        }
        var style = element.style;
        var attributes = element.attributes;
        // Copy styles as attributes and values
        if (style) {
            for (var i = 0; i < style.length; i++) {
                var styleAttrName = style[i];
                var styleValue = style.getPropertyValue(styleAttrName);
                stageObject.stylesObject[styleAttrName] = styleValue;
            }
        }
        // Copy node attributes into stage object
        if (attributes) {
            for (var j = 0; j < attributes.length; j++) {
                var nodeAttrName = attributes[j].localName;
                var nodeAttrValue = attributes[j].value;
                stageObject.attributes[nodeAttrName] = nodeAttrValue;
            }
        }
        // Hold for temporary
        var ret = {
            stylesObject: stageObject.stylesObject,
            attributes: stageObject.attributes
        };
        // Make copy - othervise sub nodes atributes remains
        stageObject.stylesObject = this.copyObject(stageObject.stylesObject);// Copy method with JSON
        stageObject.attributes = this.copyObject(stageObject.attributes);
        return ret;
    },

    copyObject: function (data) {
        if (!data) {
            return null;
        }
        return (JSON.parse(JSON.stringify(data)));
    },

// Parsing: Get element properties. Is called at #text node. @return properties object with corresponding document formats for meta data.
    getTextNodeProperties: function (element, nodeNames, stageObject) {
        if (!element || element.nodeType !== 3) {
            return null;
        }
        var ret = {};

        var styleToValueTranslation = {
            "background-color": "background",
            "color": "color",
            "font-size": "fontSize",
            "font-family": "fontFamily"
        };
        var styleToBooleanValueTranslation = {
            "-moz-text-decoration-color": "overline"
        };
        var styleDirectValueToBoolean = ["text-align", "text-decoration-line"];// Their values are attributes with value true. TODO Is "text-decoration" needed?
        var partFromTagsTofunction = {
            blockquote: "markCitation"
        };// To function name to call
        var pos = -1;
        for (var attrName in stageObject.attributes) {// stageObject.attributes contains all parents attributes up to root, bcause is collected recursivelly.
            var attrValue = stageObject.attributes[attrName];
            if ((attrValue instanceof String || typeof attrValue === "string") && attrNameToBooleanVar[attrName]) {
                var attrValueArray = attrNameToBooleanVar[attrName];
                if (Array.isArray(attrValueArray)) {
                    attrValue = attrValue.toLowerCase();
                    var arrPos = attrValueArray.indexOf(attrValue);
                    if (arrPos >= 0) {
                        ret[attrValueArray[arrPos]] = true;
                    }
                }
            }
            if (attrNameToValueTranslation[attrName]) {
                ret[attrNameToValueTranslation[attrName]] = attrValue;
            }
        }
        for (var i in nodeNames) {
            if (tagToBooleanValueTranslation[nodeNames[i]]) {
                ret[tagToBooleanValueTranslation[nodeNames[i]]] = true;
            } else if (partFromTagsTofunction[nodeNames[i]]) {
                stageObject[partFromTagsTofunction[nodeNames[i]]](); // Call fnction by name - get func name and call it on stageObject
            }
        }
        var parentStyles = stageObject.stylesObject;
        for (var styleAttrName in parentStyles) {// All previous attributes again for that element - collected from parents!?
            var styleValue = parentStyles[styleAttrName];
            try {
                pos = styleDirectValueToBoolean.indexOf(styleAttrName);
            } catch (e) {
                var tmp = e;
            }
            if (styleToValueTranslation[styleAttrName]) {
                if (styleAttrName === "font-family") {
                    styleValue = objToDomService.replaceAll("\"", "'", styleValue);// Replace font name " character
                }
                var styleTrans = styleToValueTranslation[styleAttrName];
                ret[styleTrans] = styleValue;
            } else if (styleToBooleanValueTranslation[styleAttrName]) {
                ret[styleToBooleanValueTranslation[styleAttrName]] = true;
            } else if (pos >= 0) {
                ret[styleValue] = true;
            }
        }
        return ret;
    },

    // TODO : not used - need to finish work for selecting text and seting properties through buttons
    getSelections: function () {
        var ret, selection, count, range, i;
        if (document.selection) {// IE
            document.selection.createRange().htmlText;
        } else if (window.getSelection) {//non IE
            selection = window.getSelection();
            if (selection.anchorNode.tagName !== "BODY") {
                ret = {ranges: [], contents: []};
                count = selection.rangeCount;
                for (i = 0; i < count; i++) {
                    range = selection.getRangeAt(i);
                    ret.ranges.push(range);
                    ret.contents.push(range.extractContents());
                }
            }
        }
        return ret;
    }
};



module.exports = domToJsonService;
