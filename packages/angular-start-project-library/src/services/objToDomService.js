
const objToDomService = {

    formatPairs: {
        underline: "u",
        bold: "b",
        italic: "i",
        strike: "del",
        marked: "mark"
    },

    headingPairs: {
        h1: "h1",
        h2: "h2",
        h3: "h3",
        h4: "h4",
        h5: "h5",
        h6: "h6"
    },

    stylePairs: {
        overline: "text-decoration:overline;",
        center: "text-align:center;",
        right: "text-align:right;",
        left: "text-align:left;"
    },

    valueStylePairs: {
        background: "background:",
        color: "color:",
        fontFamily: "font-family:",
        fontSize: "font-size:"
    },

    setData: function (data, targetElement) {
        this.validate(data, targetElement);
        var htmlString = this.toHtmlString(data);
        targetElement.innerHTML = htmlString;
    },

    toHtmlString: function (data) {
        var parsingData = this.processParsingData({
            data: data,
            parsed: {// Parsed and worked data
                fragments: [], // strings bindings with worked metadata
                parts: []       // parts
            }
        });
        var htmlString = this.doHtmlString(parsingData);
        return htmlString;
    },

    validate: function (data, targetElement) {
        if (!data) {
            throw "Document data undefined or null!";
        }
        if (!targetElement) {
            throw "Document element undefined or null!";
        }
        if (data.sequentialContentMetaData.length !== data.sequentialContent.length) {
            throw "Text part pieces number is not same with format data pices!";
        }
    },

    processParsingData: function (parsingData) {
        this.metaToFragments(parsingData);
        this.processParagraphs(parsingData);
        return parsingData;
    },

    metaToFragments: function (parsingData) {
        var position, metaData, fragment;
        for (position in parsingData.data.sequentialContent) {// make fragemnts array from metadata
            metaData = parsingData.data.sequentialContentMetaData[position];
            fragment = this.newFragment(parsingData, metaData, position);
            parsingData.parsed.fragments[parsingData.parsed.fragments.length] = this.reworkFragment(fragment);
        }
        return parsingData;
    },

    newFragment: function (parsingData, metaData, position) {
        var fragment = {
            tags: [], // HTML tag names to show for current fragment - bold, italic etc. Tags are collected here at rendering.
            styles: [],
            classes: [],
            styleString: null,
            data: parsingData.data,
            contentNumber: position,
            metaData: metaData, // fragment meta data acording doe an document format
            headingSize: function () { // @return number from 1-6 or 0 when heading not present
                var headingTagStr = this.findHeading();
                if (headingTagStr !== null) {
                    headingTagStr = headingTagStr.substring(1, 2);// second remains
                    return parseInt(headingTagStr);
                }
                return 0;
            },
            findHeading: function () { // @return null, when not found
                var pat = new RegExp("h[1-6]", "i"), attrName;
                for (attrName in this.tags) {
                    if (pat.test(this.tags[attrName])) {
                        return this.tags[attrName];
                    }
                }
                return null;
            },
            isHeading: function () { // @return true, if fragment is heading
                if (this.headingSize() > 0) {
                    return true;
                }
                return false;
            },
            hasFollowLink: function () { // @return true, if fragment is link
                if (this.metaData.linkFollow) {
                    return true;
                }
                return false;
            },
            isAligned: function () { // @return true, if fragment is algined left, center, right
                if (this.metaData.center ||
                        this.metaData.right ||
                        this.metaData.left) {
                    return true;
                }
                return false;
            },
            toString: function () { // @return HTML taged (bold, underline,...) fragment of text.
                var content = "", i;
                if (this.tags.length > 0) {
                    for (i = 0; i < this.tags.length; i++) {
                        content += "<" + this.tags[i];
                        if (i === 0 && this.styleString !== null) {// First tag get style things, other not
                            content += this.styleString;
                        }
                        content += ">";
                    }
                    content += parsingData.data.sequentialContent[this.contentNumber];
                    for (i = this.tags.length - 1; i >= 0; i--) {
                        content += "</" + this.tags[i] + ">";
                    }
                } else {
                    content += parsingData.data.sequentialContent[this.contentNumber];
                }
                return content;
            }
        };
        return fragment;
    },

    processParagraphs: function (parsingData) {
        // All sequential parts have their fragments, with heading level
        var fragmentLevel = 0;
        for (var partsPosition = 0; partsPosition < parsingData.data.partsMetaData.length; partsPosition++) {
            var part = this.reworkPart(parsingData.data.partsMetaData[partsPosition]);
            parsingData.parsed.parts[parsingData.parsed.parts.length] = part;
            part.fragments = [];
            for (var i = part.from; i <= part.to; i++) {
                var fragment = parsingData.parsed.fragments[i];
                var headingLevel = fragment.headingSize();
                if (headingLevel > 0) {// Heading exists
                    fragmentLevel = headingLevel;
                }
                fragment.level = fragmentLevel;
                part.fragments[part.fragments.length] = fragment;
            }
        }
        return parsingData;
    },

    // @return HTML string of document.
    doHtmlString: function (parsingData) {
        var resultString = "", partsNumber = 0, parts = parsingData.parsed.parts;
        for (var partPosition = 0; partPosition < parts.length; partPosition++) {
            resultString += parsingData.parsed.parts[partPosition].toString();
            do {// Replace placeholders with value
                var preLen = resultString.length;
                resultString = resultString.replace("data-part-id-placeholder", "p." + partsNumber.toString());// TODO : review - does we need ID after parsing?

            } while (preLen !== resultString.length);
            partsNumber++;
        }
        return resultString;
    },

    // Rendering: Metadata in part executed
    reworkPart: function (part) {
        var ret = {
            toString: function () {
                var ret = "";
                if (this.citation !== undefined && this.citation) {
                    ret += "<blockquote>";
                }
                ret += "<p>";
                var fragmentPosition = 0;
                for (var fragmentPosition = 0; fragmentPosition < this.fragments.length; fragmentPosition++) { // All part fragments
                    var fragmentIsHeading = this.fragments[fragmentPosition].isHeading();
                    if (this.fragments[fragmentPosition].metaData && this.fragments[fragmentPosition].isAligned()) {
                        // Need end and put align things to p tag, because inside p align doesnt work.
                        if (this.fragments[fragmentPosition].metaData.center) {
                            ret += "</p>";
                            ret += "<p style=\"text-align: center;\">";
                        } else if (this.fragments[fragmentPosition].metaData.right) {
                            ret += "</p>";
                            ret += "<p style=\"text-align: right;\">";
                        } else if (this.fragments[fragmentPosition].metaData.left) {
                            ret += "</p>";
                            ret += "<p style=\"text-align: left;\">";
                        } else {
                        }
                    }
                    if (fragmentIsHeading) {
                        ret += "</p>";
                    }
                    var isLink = this.fragments[fragmentPosition].hasFollowLink();
                    if (isLink) {
                        ret += "<a href=\"${linkURL}\" class='jsonDocument'>";
                        ret = objToDomService.fillPlaceholderString(ret, {linkURL: this.fragments[fragmentPosition].metaData.linkFollow});
                    }
                    // TODO : here : IMG start-end + aligin by css + src + alt (in meta)
                    ret += this.fragments[fragmentPosition].toString(); // Add String to be shown
                    if (isLink) {
                        ret += "</a>";
                    }
                    if (fragmentIsHeading) {
                        ret += "<p>";
                    }
                }
                ret += "</p>";
                if (this.citation !== undefined && this.citation) {
                    ret += "</blockquote>";
                }
                if (ret.length === 0) {
                    return ret;
                }
                do {// Remove empty paragraphs
                    var preLen = ret.length;
                    ret = ret.replace("<p></p>", "");// TODO : BUG : CHECK : Possible, that long empty (space containing) tags ar not removed!
                } while (preLen !== ret.length);
                do {
                    preLen = ret.length;
                    var replaceable = "<p data-part-id=\"data-part-id-placeholder\">";// TODO : review - does we need ID after parsing?
                    ret = ret.replace("<p>", replaceable);
                } while (preLen !== ret.length);
                return ret;
            }
        };
        for (var attrName in part) {
            ret[attrName] = part[attrName];
        }
        return ret;
    },

    // Rendering: Fragment preparation
    reworkFragment: function (fragment) {
        var shouldFindHeadings = true;
        for (var attrName in fragment.metaData) {
            var attrValue = fragment.metaData[attrName];
            if ((typeof attrValue === "boolean") && attrValue) {
                if (this.formatPairs[attrName]) {// Format pairs check
                    fragment.tags[fragment.tags.length] = this.formatPairs[attrName];
                }
                if (shouldFindHeadings && this.headingPairs[attrName]) {// Headings check
                    fragment.tags[fragment.tags.length] = this.headingPairs[attrName];
                    shouldFindHeadings = false;// No more need find headings - rirst (higher) heading wins!
                }
                if (this.stylePairs[attrName]) {// style pairs
                    fragment.styles[fragment.styles.length] = this.stylePairs[attrName];
                }
            } else if ((typeof attrValue === "string")) {
                if (this.valueStylePairs[attrName]) {// Valued style pairs
                    fragment.styles[fragment.styles.length] = this.valueStylePairs[attrName] + attrValue + ";";
                }
            }
        }
        if (fragment.styles.length > 0) {
            if (fragment.tags.length === 0) {
                fragment.tags[fragment.tags.length] = "span";// No tags added but styles need to be set then use span tag for that
            } else if (fragment.tags[0] === "del") {// DEL cant have style - overrides default del styles.
                var spanLocation = fragment.tags.indexOf("span");
                if (spanLocation === -1) {// span doesnt exists
                    fragment.tags.splice(0, 0, "span");
                } else {// Span exist
                    fragment.tags.splice(spanLocation, 1);
                    fragment.tags.splice(0, 0, "span");
                }
            }
            fragment.styleString = " style=\"";
            for (var stylePos = 0; stylePos < fragment.styles.length; stylePos++) {
                fragment.styleString += fragment.styles[stylePos];
            }
            fragment.styleString += "\"";
        }
        return fragment;
    },

    fillPlaceholderString: function (resourceString, config) {
        if (config) {
            for (var attrName in config) {
                return objToDomService.replaceAll(objToDomService.makePlaceholderRegExpStr(attrName), config[attrName], resourceString);
            }
        }
        return null;
    },

    makePlaceholderRegExpStr: function (placeholderString) {
        return "(\\$\\{" + placeholderString + "\\})";
    },

    replaceAll: function (find, replace, str) {
        var regx = new RegExp(find, 'g');
        return str.replace(regx, replace);
    }

};



module.exports = objToDomService;
