/* GENERATED FILE — do not edit.
   Built by docs/scripts/build_subsrt_iife.py from public/lib/subsrt-ts/dist
   (vendored subsrt-ts ESM build, entry subsrt.js).
   After a lib upgrade regenerate: python3 docs/scripts/build_subsrt_iife.py
   Gate: bash tests/subsrt-iife-check.sh */
(function (window) {
'use strict';
var __modules = Object.create(null);
function __def(id, factory) {
    var module = { exports: {} };
    factory(module, module.exports);
    __modules[id] = module.exports;
}
function __req(id) {
    return __modules[id];
}

__def("handler.js", function (module, exports) {
/**
 * Handler class.
 */
class Handler {
    /**
     * Creates a new handler.
     * @param args The handler properties (`name`, `build`, `detect`, `helper` and `parse`)
     * @see
     * - {@link BaseHandler}
     * - {@link BuildFunction}
     * - {@link DetectFunction}
     * - {@link Helper}
     * - {@link ParseFunction}
     * - {@link ParseOptions}
     * @example
     * ```ts
     * const handler = new Handler({
     *     name: "ext",
     *     build: (captions: Caption[], options: BuildOptions): string => {
     *         // ...
     *     },
     *     detect: (content: string): boolean | string => {
     *         // ...
     *     },
     *     parse: (content: string, options: ParseOptions): Caption[] => {
     *         // ...
     *     },
     * });
     * ```
     */
    constructor({ name, build, detect, helper, parse }) {
        this.name = name;
        this.helper = helper;
        this.build = build;
        this.detect = (content) => {
            if (typeof content !== "string") {
                throw new TypeError(`Expected string, got ${typeof content}!`);
            }
            return detect(content);
        };
        this.parse = (content, _options) => {
            if (typeof content !== "string") {
                throw new TypeError(`Expected string, got ${typeof content}!`);
            }
            return parse(content, _options);
        };
    }
}
/**
 * Build a handler.
 * @param args The handler properties
 * @returns The handler
 * @see {@link Handler}
 */
const buildHandler = (args) => {
    return new Handler(args);
};
module.exports['Handler'] = Handler;
module.exports['buildHandler'] = buildHandler;

});

__def("format/ssa.js", function (module, exports) {
var buildHandler = __req('handler.js')['buildHandler'];
const FORMAT_NAME = "ssa";
const helper = {
    /**
     * Converts a time string in format of hh:mm:ss.fff or hh:mm:ss,fff to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s) => {
        const match = /^\s*(\d+:)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?\s*$/.exec(s);
        if (!match) {
            throw new TypeError(`Invalid time format: ${s}`);
        }
        const hh = match[1] ? parseInt(match[1].replace(":", "")) : 0;
        const mm = parseInt(match[2], 10);
        const ss = parseInt(match[3], 10);
        const ff = match[4] ? parseInt(match[4], 10) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff * 10;
        return ms;
    },
    /**
     * Converts milliseconds to a time string in format of hh:mm:ss.fff.
     * @param ms Milliseconds
     * @returns Time string in format of hh:mm:ss.fff
     */
    toTimeString: (ms) => {
        const hh = Math.floor(ms / 1000 / 3600);
        const mm = Math.floor((ms / 1000 / 60) % 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor((ms % 1000) / 10); // 2 digits
        const time = `${hh}:${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss}.${ff < 10 ? "0" : ""}${ff}`;
        return time;
    },
};
/**
 * Internal helper function for building caption data.
 * @param columns Columns
 * @param values Values
 * @returns Caption data
 * @private
 */
const _buildCaptionData = (columns, values) => {
    const data = {};
    for (let c = 0; c < columns.length && c < values.length; c++) {
        data[columns[c]] = values[c];
    }
    return data;
};
/**
 * Parses captions in SubStation Alpha format (.ssa).
 * @param content The subtitle content
 * @param options Parse options
 * @throws {TypeError} If the meta data is in invalid format
 * @returns Parsed captions
 */
const parse = (content, options) => {
    var _a;
    let meta;
    let columns = null;
    const captions = [];
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    const parts = content.split(/\r?\n\s*\n/);
    for (const part of parts) {
        const regex = /^\s*\[([^\]]+)\]\r?\n([\s\S]*)$/;
        const match = regex.exec(part);
        if (match) {
            const tag = match[1];
            const lines = match[2].split(/\r?\n/);
            for (const line of lines) {
                if (/^\s*;/.test(line)) {
                    continue; // Skip comment
                }
                // FIXME: prevent backtracking
                // eslint-disable-next-line regexp/no-super-linear-backtracking
                const lineMatch = /^\s*([^\s:]+):\s*(.*)$/.exec(line);
                if (!lineMatch) {
                    continue;
                }
                if (tag === "Script Info") {
                    if (!meta) {
                        meta = {};
                        meta.type = "meta";
                        meta.data = {};
                        captions.push(meta);
                    }
                    if (typeof meta.data === "object") {
                        const name = lineMatch[1].trim();
                        const value = lineMatch[2].trim();
                        meta.data[name] = value;
                    }
                    else {
                        throw new TypeError(`Invalid meta data: ${line}`);
                    }
                }
                else if (tag === "V4 Styles" || tag === "V4+ Styles") {
                    const name = lineMatch[1].trim();
                    const value = lineMatch[2].trim();
                    if (name === "Format") {
                        columns = value.split(/\s*,\s*/);
                    }
                    else if (name === "Style" && columns) {
                        const values = value.split(/\s*,\s*/);
                        const caption = {};
                        caption.type = "style";
                        caption.data = _buildCaptionData(columns, values);
                        captions.push(caption);
                    }
                }
                else if (tag === "Events") {
                    const name = lineMatch[1].trim();
                    const value = lineMatch[2].trim();
                    if (name === "Format") {
                        columns = value.split(/\s*,\s*/);
                    }
                    else if (name === "Dialogue" && columns) {
                        const values = value.split(/\s*,\s*/);
                        const caption = {};
                        caption.type = "caption";
                        caption.data = _buildCaptionData(columns, values);
                        caption.start = helper.toMilliseconds(caption.data.Start);
                        caption.end = helper.toMilliseconds(caption.data.End);
                        caption.duration = caption.end - caption.start;
                        caption.content = caption.data.Text;
                        // Work-around for missing text (when the text contains ',' char)
                        const indexOfText = value.split(",", columns.length - 1).join(",").length + 1 + 1;
                        caption.content = value.substring(indexOfText);
                        caption.data.Text = caption.content;
                        caption.text = caption.content
                            .replace(/\\N/g, eol) // "\N" for new line
                            .replace(/\{[^}]+\}/g, ""); // {\pos(400,570)}
                        captions.push(caption);
                    }
                }
            }
        }
        if (options.verbose) {
            console.warn("Unknown part", part);
        }
    }
    return captions;
};
/**
 * Builds captions in SubStation Alpha format (.ssa).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SubStation Alpha format
 */
const build = (captions, options) => {
    var _a;
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    const ass = options.format === "ass";
    let content = "";
    content += `[Script Info]${eol}`;
    content += `; Script generated by subsrt ${eol}`;
    content += `ScriptType: v4.00${ass ? "+" : ""}${eol}`;
    content += `Collisions: Normal${eol}`;
    content += eol;
    if (ass) {
        content += `[V4+ Styles]${eol}`;
        content += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding${eol}`;
        content += `Style: DefaultVCD, Arial,28,&H00B4FCFC,&H00B4FCFC,&H00000008,&H80000008,-1,0,0,0,100,100,0.00,0.00,1,1.00,2.00,2,30,30,30,0${eol}`;
    }
    else {
        content += `[V4 Styles]${eol}`;
        content += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, TertiaryColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding${eol}`;
        content += `Style: DefaultVCD, Arial,28,11861244,11861244,11861244,-2147483640,-1,0,1,1,2,2,30,30,30,0,0${eol}`;
    }
    content += eol;
    content += `[Events]${eol}`;
    content += `Format: ${ass ? "Layer" : "Marked"}, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text${eol}`;
    for (const caption of captions) {
        if (caption.type === "meta") {
            continue;
        }
        if (!caption.type || caption.type === "caption") {
            content += `Dialogue: ${ass ? "0" : "Marked=0"},${helper.toTimeString(caption.start)},${helper.toTimeString(caption.end)},DefaultVCD, NTP,0000,0000,0000,,${caption.text.replace(/\r?\n/g, "\\N")}${eol}`;
            continue;
        }
        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }
    return content;
};
/**
 * Detects whether the content is in ASS or SSA format.
 * @param content The subtitle content
 * @returns Whether the content is in "ass", "ssa" or neither
 */
const detect = (content) => {
    if (/^\s*\[Script Info\]\r?\n/.test(content) && /\s*\[Events\]\r?\n/.test(content)) {
        /*
        [Script Info]
        ...
        [Events]
        */
        // Advanced (V4+) styles for ASS format
        return content.indexOf("[V4+ Styles]") > 0 ? "ass" : "ssa";
    }
    return false;
};
module.exports.default = buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
module.exports['name'] = FORMAT_NAME;
module.exports['build'] = build;
module.exports['detect'] = detect;
module.exports['helper'] = helper;
module.exports['parse'] = parse;

});

__def("format/ass.js", function (module, exports) {
var buildHandler = __req('handler.js')['buildHandler'];
const FORMAT_NAME = "ass";
// Compatible format
var build = __req('format/ssa.js')['build'];
var detect = __req('format/ssa.js')['detect'];
var helper = __req('format/ssa.js')['helper'];
var parse = __req('format/ssa.js')['parse'];
module.exports.default = buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
module.exports['name'] = FORMAT_NAME;
module.exports['build'] = build;
module.exports['detect'] = detect;
module.exports['helper'] = helper;
module.exports['parse'] = parse;

});

__def("format/json.js", function (module, exports) {
var buildHandler = __req('handler.js')['buildHandler'];
const FORMAT_NAME = "json";
/**
 * Parses captions in JSON format.
 * @param content The subtitle content
 * @param _options Parse options
 * @returns Parsed captions
 */
const parse = (content, _options) => JSON.parse(content);
/**
 * Builds captions in JSON format.
 * @param captions The captions to build
 * @param _options Build options
 * @returns The built captions string in JSON format
 */
const build = (captions, _options) => JSON.stringify(captions, undefined, 2);
/**
 * Detects whether the content is in JSON format.
 * @param content The subtitle content
 * @returns Whether the content is in JSON format
 */
const detect = (content) => {
    /*
    [
        { ... }
    ]
    */
    // return /^\[[\s\r\n]*\{[\s\S]*\}[\s\r\n]*\]$/g.test(content);
    try {
        const res = JSON.parse(content);
        return Array.isArray(res) && res.length > 0 && typeof res[0] === "object";
    }
    catch (e) {
        return false;
    }
};
module.exports.default = buildHandler({ name: FORMAT_NAME, build, detect, parse });
module.exports['name'] = FORMAT_NAME;
module.exports['build'] = build;
module.exports['detect'] = detect;
module.exports['parse'] = parse;

});

__def("format/lrc.js", function (module, exports) {
var buildHandler = __req('handler.js')['buildHandler'];
const FORMAT_NAME = "lrc";
const helper = {
    /**
     * Converts a time string in format of mm:ss.ff or mm:ss,ff to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s) => {
        const match = /^\s*(\d+):(\d{1,2})(?:[.,](\d{1,3}))?\s*$/.exec(s);
        if (!match) {
            throw new TypeError(`Invalid time format: ${s}`);
        }
        const mm = parseInt(match[1], 10);
        const ss = parseInt(match[2], 10);
        const ff = match[3] ? parseInt(match[3], 10) : 0;
        const ms = mm * 60 * 1000 + ss * 1000 + ff * 10;
        return ms;
    },
    /**
     * Converts milliseconds to a time string in format of mm:ss.ff.
     * @param ms Milliseconds
     * @returns Time string in format of mm:ss.ff
     */
    toTimeString: (ms) => {
        const mm = Math.floor(ms / 1000 / 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor(ms % 1000);
        const time = `${(mm < 10 ? "0" : "") + mm}:${ss < 10 ? "0" : ""}${ss}.${ff < 100 ? "0" : ""}${ff < 10 ? "0" : Math.floor(ff / 10)}`;
        return time;
    },
};
/**
 * Parses captions in LRC format.
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 * @see https://en.wikipedia.org/wiki/LRC_%28file_format%29
 */
const parse = (content, options) => {
    let prev = null;
    const captions = [];
    // const eol = options.eol || "\r\n";
    const parts = content.split(/\r?\n/);
    for (const part of parts) {
        if (!part || part.trim().length === 0) {
            continue;
        }
        // LRC content
        const regex = /^\[(\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\](.*)(?:\r?\n)*$/;
        const match = regex.exec(part);
        if (match) {
            const caption = {};
            caption.type = "caption";
            caption.start = helper.toMilliseconds(match[1]);
            caption.end = caption.start + 2000;
            caption.duration = caption.end - caption.start;
            caption.content = match[2];
            caption.text = caption.content;
            captions.push(caption);
            // Update previous
            if (prev) {
                prev.end = caption.start;
                prev.duration = prev.end - prev.start;
            }
            prev = caption;
            continue;
        }
        // LRC meta
        const meta = /^\[(\w+):([^\]]*)\](?:\r?\n)*$/.exec(part);
        if (meta) {
            const caption = {};
            caption.type = "meta";
            caption.tag = meta[1];
            if (meta[2]) {
                caption.data = meta[2];
            }
            captions.push(caption);
            continue;
        }
        if (options.verbose) {
            console.warn("Unknown part", part);
        }
    }
    return captions;
};
/**
 * Builds captions in LRC format.
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in LRC format
 * @see https://en.wikipedia.org/wiki/LRC_%28file_format%29
 */
const build = (captions, options) => {
    var _a;
    let content = "";
    let lyrics = false;
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    for (const caption of captions) {
        if (caption.type === "meta") {
            if (caption.tag && caption.data && typeof caption.data === "string") {
                content += `[${caption.tag}:${caption.data.replace(/[\r\n]+/g, " ")}]${eol}`;
            }
            continue;
        }
        if (!caption.type || caption.type === "caption") {
            if (!lyrics) {
                content += eol; //New line when lyrics start
                lyrics = true;
            }
            content += `[${helper.toTimeString(caption.start)}]${caption.text}${eol}`;
            continue;
        }
        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }
    return content;
};
/**
 * Detects whether the content is in LRC format.
 * @param content The subtitle content
 * @returns Format name if detected, or null if not detected
 */
const detect = (content) => {
    /*
    [04:48.28]Sister, perfume?
    */
    return /\r?\n\[\d+:\d{1,2}(?:[.,]\d{1,3})?\].*\r?\n/.test(content);
};
module.exports.default = buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
module.exports['name'] = FORMAT_NAME;
module.exports['build'] = build;
module.exports['detect'] = detect;
module.exports['helper'] = helper;
module.exports['parse'] = parse;

});

__def("format/sbv.js", function (module, exports) {
var buildHandler = __req('handler.js')['buildHandler'];
const FORMAT_NAME = "sbv";
const helper = {
    /**
     * Converts a time string in format of hh:mm:ss.sss or hh:mm:ss,sss to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s) => {
        const match = /^\s*(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?\s*$/.exec(s);
        if (!match) {
            throw new TypeError(`Invalid time format: ${s}`);
        }
        const hh = parseInt(match[1], 10);
        const mm = parseInt(match[2], 10);
        const ss = parseInt(match[3], 10);
        const ff = match[4] ? parseInt(match[4], 10) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff;
        return ms;
    },
    /**
     * Converts milliseconds to a time string in format of hh:mm:ss.sss.
     * @param ms Milliseconds
     * @returns Time string in format of hh:mm:ss.sss
     */
    toTimeString: (ms) => {
        const hh = Math.floor(ms / 1000 / 3600);
        const mm = Math.floor((ms / 1000 / 60) % 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor(ms % 1000);
        const time = `${(hh < 10 ? "0" : "") + hh}:${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss}.${ff < 100 ? "0" : ""}${ff < 10 ? "0" : ""}${ff}`;
        return time;
    },
};
/**
 * Parses captions in SubViewer format (.sbv).
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 */
const parse = (content, options) => {
    var _a;
    const captions = [];
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    const parts = content.split(/\r?\n\s*\n/);
    for (const part of parts) {
        const regex = /^(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\s*[,;]\s*(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\r?\n([\s\S]*)$/;
        const match = regex.exec(part);
        if (match) {
            const caption = {};
            caption.type = "caption";
            caption.start = helper.toMilliseconds(match[1]);
            caption.end = helper.toMilliseconds(match[2]);
            caption.duration = caption.end - caption.start;
            const lines = match[3].split(/\[br\]|\r?\n/i);
            caption.content = lines.join(eol);
            caption.text = caption.content.replace(/>>[^:]+:\s*/g, ""); // >> SPEAKER NAME:
            captions.push(caption);
            continue;
        }
        if (options.verbose) {
            console.warn("Unknown part", part);
        }
    }
    return captions;
};
/**
 * Builds captions in SubViewer format (.sbv).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SubViewer format
 */
const build = (captions, options) => {
    var _a;
    let content = "";
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    for (const caption of captions) {
        if (!caption.type || caption.type === "caption") {
            content += `${helper.toTimeString(caption.start)},${helper.toTimeString(caption.end)}${eol}`;
            content += caption.text + eol;
            content += eol;
            continue;
        }
        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }
    return content;
};
/**
 * Detects whether the content is in SubViewer format.
 * @param content The subtitle content
 * @returns Whether the subtitle format is SubViewer
 */
const detect = (content) => {
    /*
    00:04:48.280,00:04:50.510
    Sister, perfume?
    */
    return /\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?\s*[,;]\s*\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?/.test(content);
};
module.exports.default = buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
module.exports['name'] = FORMAT_NAME;
module.exports['build'] = build;
module.exports['detect'] = detect;
module.exports['helper'] = helper;
module.exports['parse'] = parse;

});

__def("format/smi.js", function (module, exports) {
var buildHandler = __req('handler.js')['buildHandler'];
const FORMAT_NAME = "smi";
const helper = {
    /**
     * Encodes a string to be used in XML.
     * @param text - The text to be encoded
     * @returns The HTML-encoded string
     */
    htmlEncode: (text) => text
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        //.replace(/\s/g, '&nbsp;')
        .replace(/\r?\n/g, "<BR>"),
    /**
     * Decodes a string that has been HTML-encoded.
     * @param html The HTML-encoded string to decode
     * @param eol The end-of-line character to use
     * @returns The decoded string
     */
    htmlDecode: (html, eol) => html
        .replace(/<BR\s*\/?>/gi, eol || "\r\n")
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&"),
};
/**
 * Parses captions in SAMI format (.smi).
 * @param content The subtitle content
 * @param options Parse options
 * @throw {TypeError} When the format is not supported
 * @returns Parsed captions
 */
const parse = (content, options) => {
    var _a, _b;
    if (options.format && options.format !== FORMAT_NAME) {
        throw new TypeError(`Invalid format: ${options.format}`);
    }
    const captions = [];
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    const title = /<TITLE[^>]*>([\s\S]*)<\/TITLE>/i.exec(content);
    if (title) {
        const caption = {};
        caption.type = "meta";
        caption.name = "title";
        caption.data = title[1].replace(/^\s*/g, "").replace(/\s*$/g, "");
        captions.push(caption);
    }
    const style = /<STYLE[^>]*>([\s\S]*)<\/STYLE>/i.exec(content);
    if (style) {
        const caption = {};
        caption.type = "meta";
        caption.name = "style";
        caption.data = style[1];
        captions.push(caption);
    }
    const sami = content
        .replace(/^[\s\S]*<BODY[^>]*>/gi, "") // Remove content before body
        .replace(/<\/BODY[^>]*>[\s\S]*$/gi, ""); // Remove content after body
    let prev = null;
    const parts = sami.split(/<SYNC/i);
    for (const _part of parts) {
        if (!_part || _part.trim().length === 0) {
            continue;
        }
        const part = `<SYNC${_part}`;
        // <SYNC Start = 1000>
        const match = /^<SYNC[^>]+Start\s*=\s*["']?(\d+)[^\d>]*>([\s\S]*)/i.exec(part);
        if (match) {
            const caption = {};
            caption.type = "caption";
            caption.start = parseInt(match[1], 10);
            caption.end = caption.start + 2000;
            caption.duration = caption.end - caption.start;
            caption.content = match[2].replace(/^<\/SYNC[^>]*>/gi, "");
            let blank = true;
            const pMatch = (_b = /^<P.+Class\s*=\s*["']?([\w-]+)(?: .*)?>([\s\S]*)/i.exec(caption.content)) !== null && _b !== void 0 ? _b : /^<P([^>]*)>([\s\S]*)/i.exec(caption.content);
            if (pMatch) {
                let html = pMatch[2].replace(/<P[\s\S]+$/gi, ""); // Remove string after another <P> tag
                html = html
                    .replace(/<BR\s*\/?>\s+/gi, eol)
                    .replace(/<BR\s*\/?>/gi, eol)
                    .replace(/<[^>]+>/g, ""); // Remove all tags
                html = html.replace(/^\s+/g, "").replace(/\s+$/g, ""); // Trim new lines and spaces
                blank = html.replace(/&nbsp;/gi, " ").replace(/\s+/g, "").length === 0;
                caption.text = helper.htmlDecode(html, eol);
            }
            if (!options.preserveSpaces && blank) {
                if (options.verbose) {
                    console.log(`INFO: Skipping white space caption at ${caption.start}`);
                }
            }
            else {
                captions.push(caption);
            }
            // Update previous
            if (prev) {
                prev.end = caption.start;
                prev.duration = prev.end - prev.start;
            }
            prev = caption;
            continue;
        }
        if (options.verbose) {
            console.warn("Unknown part", _part);
        }
    }
    return captions;
};
/**
 * Builds captions in SAMI format (.smi).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SAMI format
 */
const build = (captions, options) => {
    var _a, _b, _c, _d;
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    let content = "";
    content += `<SAMI>${eol}`;
    content += `<HEAD>${eol}`;
    content += `<TITLE>${(_b = options.title) !== null && _b !== void 0 ? _b : ""}</TITLE>${eol}`;
    content += `<STYLE TYPE="text/css">${eol}`;
    content += `<!--${eol}`;
    content += `P { font-family: Arial; font-weight: normal; color: white; background-color: black; text-align: center; }${eol}`;
    content += `.LANG { Name: ${(_c = options.langName) !== null && _c !== void 0 ? _c : "English"}; lang: ${(_d = options.langCode) !== null && _d !== void 0 ? _d : "en-US"}; SAMIType: CC; }${eol}`;
    content += `-->${eol}`;
    content += `</STYLE>${eol}`;
    content += `</HEAD>${eol}`;
    content += `<BODY>${eol}`;
    for (const caption of captions) {
        if (caption.type === "meta") {
            continue;
        }
        if (!caption.type || caption.type === "caption") {
            // Start of caption
            content += `<SYNC Start=${caption.start}>${eol}`;
            content += `  <P Class=LANG>${helper.htmlEncode(caption.text || "")}${options.closeTags ? "</P>" : ""}${eol}`;
            if (options.closeTags) {
                content += `</SYNC>${eol}`;
            }
            // Blank line indicates the end of caption
            content += `<SYNC Start=${caption.end}>${eol}`;
            content += `  <P Class=LANG>&nbsp;${options.closeTags ? "</P>" : ""}${eol}`;
            if (options.closeTags) {
                content += `</SYNC>${eol}`;
            }
            continue;
        }
        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }
    content += `</BODY>${eol}`;
    content += `</SAMI>${eol}`;
    return content;
};
/**
 * Detects whether the content is in SAMI format.
 * @param content The content to be detected
 * @returns Whether the subtitle format is SAMI
 */
const detect = (content) => {
    /*
    <SAMI>
    <BODY>
    <SYNC Start=...
    ...
    </BODY>
    </SAMI>
    */
    return /<SAMI[^>]*>[\s\S]*<BODY[^>]*>/.test(content);
};
module.exports.default = buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
module.exports['name'] = FORMAT_NAME;
module.exports['build'] = build;
module.exports['detect'] = detect;
module.exports['helper'] = helper;
module.exports['parse'] = parse;

});

__def("format/srt.js", function (module, exports) {
var buildHandler = __req('handler.js')['buildHandler'];
const FORMAT_NAME = "srt";
const helper = {
    /**
     * Converts a time string in format of hh:mm:ss, hh:mm:ss.sss or hh:mm:ss,sss to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s) => {
        const match = /^\s*(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?\s*$/.exec(s);
        if (!match) {
            throw new TypeError(`Invalid time format: ${s}`);
        }
        const hh = parseInt(match[1], 10);
        const mm = parseInt(match[2], 10);
        const ss = parseInt(match[3], 10);
        const ff = match[4] ? parseInt(match[4], 10) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff;
        return ms;
    },
    /**
     * Converts milliseconds to a time string in format of hh:mm:ss,sss.
     * @param ms Milliseconds
     * @returns Time string in format of hh:mm:ss,sss
     */
    toTimeString: (ms) => {
        const hh = Math.floor(ms / 1000 / 3600);
        const mm = Math.floor((ms / 1000 / 60) % 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor(ms % 1000);
        const time = `${(hh < 10 ? "0" : "") + hh}:${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss},${ff < 100 ? "0" : ""}${ff < 10 ? "0" : ""}${ff}`;
        return time;
    },
};
/**
 * Parses captions in SubRip format (.srt).
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 */
const parse = (content, options) => {
    var _a;
    const captions = [];
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    const parts = content.split(/\r?\n\s*\n/);
    for (const part of parts) {
        const regex = /^(\d+)\r?\n(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\s*-->\s*(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\r?\n([\s\S]*)$/;
        const match = regex.exec(part);
        if (match) {
            const caption = {};
            caption.type = "caption";
            caption.index = parseInt(match[1], 10);
            caption.start = helper.toMilliseconds(match[2]);
            caption.end = helper.toMilliseconds(match[3]);
            caption.duration = caption.end - caption.start;
            const lines = match[4].split(/\r?\n/);
            caption.content = lines.join(eol);
            caption.text = caption.content
                .replace(/<[^>]+>/g, "") // <b>bold</b> or <i>italic</i>
                .replace(/\{[^}]+\}/g, "") // {b}bold{/b} or {i}italic{/i}
                .replace(/>>[^:]*:\s*/g, ""); // >> SPEAKER NAME:
            captions.push(caption);
            continue;
        }
        if (options.verbose) {
            console.warn("Unknown part", part);
        }
    }
    return captions;
};
/**
 * Builds captions in SubRip format (.srt).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SubRip format
 */
const build = (captions, options) => {
    var _a;
    let srt = "";
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    for (let i = 0; i < captions.length; i++) {
        const caption = captions[i];
        if (!caption.type || caption.type === "caption") {
            srt += (i + 1).toString() + eol;
            srt += `${helper.toTimeString(caption.start)} --> ${helper.toTimeString(caption.end)}${eol}`;
            srt += caption.text + eol;
            srt += eol;
            continue;
        }
        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }
    return srt;
};
/**
 * Detects whether the content is in SubRip format.
 * @param content The subtitle content
 * @returns Whether the content is in SubRip format
 */
const detect = (content) => {
    /*
    3
    00:04:48,280 --> 00:04:50,510
    Sister, perfume?
    */
    return /\d+\r?\n\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?\s*-->\s*\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?/.test(content);
};
module.exports.default = buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
module.exports['name'] = FORMAT_NAME;
module.exports['build'] = build;
module.exports['detect'] = detect;
module.exports['helper'] = helper;
module.exports['parse'] = parse;

});

__def("format/sub.js", function (module, exports) {
var buildHandler = __req('handler.js')['buildHandler'];
const FORMAT_NAME = "sub";
const DEFAULT_FPS = 25;
/**
 * Parses captions in MicroDVD format.
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 * @see https://en.wikipedia.org/wiki/MicroDVD
 */
const parse = (content, options) => {
    var _a;
    options.fps || (options.fps = DEFAULT_FPS);
    const fps = options.fps > 0 ? options.fps : DEFAULT_FPS;
    const captions = [];
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    const parts = content.split(/\r?\n/);
    for (let i = 0; i < parts.length; i++) {
        const regex = /^\{(\d+)\}\{(\d+)\}(.*)$/;
        const match = regex.exec(parts[i]);
        if (match) {
            const caption = {};
            caption.type = "caption";
            caption.index = i + 1;
            caption.frame = {
                start: parseInt(match[1], 10),
                end: parseInt(match[2], 10),
                count: parseInt(match[2]) - parseInt(match[1], 10),
            };
            caption.start = Math.round(caption.frame.start / fps);
            caption.end = Math.round(caption.frame.end / fps);
            caption.duration = caption.end - caption.start;
            const lines = match[3].split(/\|/);
            caption.content = lines.join(eol);
            caption.text = caption.content.replace(/\{[^}]+\}/g, ""); // {0}{25}{c:$0000ff}{y:b,u}{f:DeJaVuSans}{s:12}Hello!
            captions.push(caption);
            continue;
        }
        if (options.verbose) {
            console.warn("Unknown part", parts[i]);
        }
    }
    return captions;
};
/**
 * Builds captions in MicroDVD format.
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in MicroDVD format
 * @see https://en.wikipedia.org/wiki/MicroDVD
 */
const build = (captions, options) => {
    var _a, _b;
    const fps = ((_a = options.fps) !== null && _a !== void 0 ? _a : 0) > 0 ? options.fps : DEFAULT_FPS;
    let sub = "";
    const eol = (_b = options.eol) !== null && _b !== void 0 ? _b : "\r\n";
    for (const caption of captions) {
        if (!caption.type || caption.type === "caption") {
            const startFrame = typeof caption.frame === "object" && caption.frame.start >= 0 ? caption.frame.start : caption.start * fps;
            const endFrame = typeof caption.frame === "object" && caption.frame.end >= 0 ? caption.frame.end : caption.end * fps;
            const text = caption.text.replace(/\r?\n/, "|");
            sub += `{${startFrame}}{${endFrame}}${text}${eol}`;
            continue;
        }
        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }
    return sub;
};
/**
 * Detects whether the content is in MicroDVD format.
 * @param content The subtitle content
 * @returns Whether it's MicroDVD format
 */
const detect = (content) => {
    /*
    {7207}{7262}Sister, perfume?
    */
    return /^\{\d+\}\{\d+\}.*/.test(content);
};
module.exports.default = buildHandler({ name: FORMAT_NAME, build, detect, parse });
module.exports['name'] = FORMAT_NAME;
module.exports['build'] = build;
module.exports['detect'] = detect;
module.exports['parse'] = parse;

});

__def("format/vtt.js", function (module, exports) {
var buildHandler = __req('handler.js')['buildHandler'];
const FORMAT_NAME = "vtt";
const helper = {
    /**
     * Converts a time string in format of hh:mm:ss.fff or hh:mm:ss,fff to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s) => {
        const match = /^\s*(\d{1,2}:)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?\s*$/.exec(s);
        if (!match) {
            throw new TypeError(`Invalid time format: ${s}`);
        }
        const hh = match[1] ? parseInt(match[1].replace(":", "")) : 0;
        const mm = parseInt(match[2], 10);
        const ss = parseInt(match[3], 10);
        const ff = match[4] ? parseInt(match[4], 10) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff;
        return ms;
    },
    /**
     * Converts milliseconds to a time string in format of hh:mm:ss.fff.
     * @param ms Milliseconds
     * @returns Time string in format of hh:mm:ss.fff
     */
    toTimeString: (ms) => {
        const hh = Math.floor(ms / 1000 / 3600);
        const mm = Math.floor((ms / 1000 / 60) % 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor(ms % 1000);
        const time = `${(hh < 10 ? "0" : "") + hh}:${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss}.${ff < 100 ? "0" : ""}${ff < 10 ? "0" : ""}${ff}`;
        return time;
    },
};
/**
 * Parses captions in WebVTT format (Web Video Text Tracks Format).
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 */
const parse = (content, options) => {
    var _a;
    let index = 1;
    const captions = [];
    const parts = content.split(/\r?\n\s*\n/);
    for (const part of parts) {
        // WebVTT data
        const regex = /^([^\r\n]+\r?\n)?((?:\d{1,2}:)?\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\s*-->\s*((?:\d{1,2}:)?\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)[^\S\r\n]?.*\r?\n([\s\S]*)$/;
        const match = regex.exec(part);
        if (match) {
            const caption = {};
            caption.type = "caption";
            caption.index = index++;
            if (match[1]) {
                caption.cue = match[1].replace(/[\r\n]*/g, "");
            }
            caption.start = helper.toMilliseconds(match[2]);
            caption.end = helper.toMilliseconds(match[3]);
            caption.duration = caption.end - caption.start;
            caption.content = match[4];
            caption.text = caption.content
                .replace(/<[^>]+>/g, "") // <b>bold</b> or <i>italic</i>
                .replace(/\{[^}]+\}/g, ""); // {b}bold{/b} or {i}italic{/i}
            captions.push(caption);
            continue;
        }
        // WebVTT meta
        // FIXME: prevent backtracking
        // eslint-disable-next-line regexp/no-super-linear-backtracking
        const meta = (_a = /^([A-Z]+)(\r?\n([\s\S]*))?$/.exec(part)) !== null && _a !== void 0 ? _a : /^([A-Z]+)\s+([^\r\n]*)$/.exec(part);
        if (meta) {
            const caption = {};
            caption.type = "meta";
            caption.name = meta[1];
            if (meta[3]) {
                caption.data = meta[3];
            }
            captions.push(caption);
            continue;
        }
        if (options.verbose) {
            console.warn("Unknown part", part);
        }
    }
    return captions;
};
/**
 * Builds captions in WebVTT format (Web Video Text Tracks Format).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in WebVTT format
 */
const build = (captions, options) => {
    var _a;
    const eol = (_a = options.eol) !== null && _a !== void 0 ? _a : "\r\n";
    let content = `WEBVTT${eol}${eol}`;
    for (let i = 0; i < captions.length; i++) {
        const caption = captions[i];
        if (caption.type === "meta") {
            if (caption.name === "WEBVTT") {
                continue;
            }
            content += caption.name + eol;
            content += typeof caption.data === "string" ? caption.data + eol : "";
            content += eol;
            continue;
        }
        if (!caption.type || caption.type === "caption") {
            content += (i + 1).toString() + eol;
            content += `${helper.toTimeString(caption.start)} --> ${helper.toTimeString(caption.end)}${eol}`;
            content += caption.text + eol;
            content += eol;
            continue;
        }
        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }
    return content;
};
/**
 * Detects whether the content is in WebVTT format.
 * @param content The subtitle content
 * @returns Whether the content is in WebVTT format
 */
const detect = (content) => {
    /*
    WEBVTT
    ...
    */
    return /^\s*WEBVTT\r?\n/.test(content);
};
module.exports.default = buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
module.exports['name'] = FORMAT_NAME;
module.exports['build'] = build;
module.exports['detect'] = detect;
module.exports['helper'] = helper;
module.exports['parse'] = parse;

});

__def("format/index.js", function (module, exports) {
var ass = __req('format/ass.js').default;
var json = __req('format/json.js').default;
var lrc = __req('format/lrc.js').default;
var sbv = __req('format/sbv.js').default;
var smi = __req('format/smi.js').default;
var srt = __req('format/srt.js').default;
var ssa = __req('format/ssa.js').default;
var sub = __req('format/sub.js').default;
var vtt = __req('format/vtt.js').default;
const formats = {
    vtt,
    lrc,
    smi,
    ssa,
    ass,
    sub,
    srt,
    sbv,
    json,
};
module.exports.default = formats;
});

__def("subsrt.js", function (module, exports) {
var formats = __req('format/index.js').default;
/**
 * Clones an object.
 * @param obj The object to clone
 * @returns The cloned object
 */
const clone = (obj) => JSON.parse(JSON.stringify(obj));
/**
 * Main subsrt class.
 */
class Subsrt {
    constructor() {
        this.format = formats;
        /**
         * Gets a list of supported subtitle formats.
         * @returns The list of supported subtitle formats
         */
        this.list = () => Object.keys(this.format);
        /**
         * Detects a subtitle format from the content.
         * @param content The subtitle content
         * @returns The detected format
         */
        this.detect = (content) => {
            const formats = this.list();
            for (const format of formats) {
                const handler = this.format[format];
                if (typeof handler === "undefined") {
                    continue;
                }
                if (typeof handler.detect !== "function") {
                    continue;
                }
                // Function 'detect' can return true or format name
                const detected = handler.detect(content);
                if (detected === true || detected === format) {
                    return format;
                }
            }
            return "";
        };
        /**
         * Parses a subtitle content.
         * @param content The subtitle content
         * @param options The parsing options
         * @throws {TypeError} If the format cannot be determined
         * @throws {TypeError} If the format is not supported
         * @throws {TypeError} If the handler does not support 'parse' op
         * @returns The parsed captions
         */
        this.parse = (content, options = {}) => {
            var _a;
            const format = (_a = options.format) !== null && _a !== void 0 ? _a : this.detect(content);
            if (!format || format.trim().length === 0) {
                throw new TypeError("Cannot determine subtitle format");
            }
            const handler = this.format[format];
            if (typeof handler === "undefined") {
                throw new TypeError(`Unsupported subtitle format: ${format}`);
            }
            const func = handler.parse;
            if (typeof func !== "function") {
                throw new TypeError(`Subtitle format does not support 'parse' op: ${format}`);
            }
            return func(content, options);
        };
        /**
         * Builds a subtitle content.
         * @param captions The captions to build
         * @param options The building options
         * @throws {TypeError} If the format cannot be determined
         * @throws {TypeError} If the format is not supported
         * @throws {TypeError} If the handler does not support 'build' op
         * @returns The built subtitle content
         */
        this.build = (captions, options = {}) => {
            const format = options.format || "srt";
            if (!format || format.trim().length === 0) {
                throw new TypeError("Cannot determine subtitle format");
            }
            const handler = this.format[format];
            if (typeof handler === "undefined") {
                throw new TypeError(`Unsupported subtitle format: ${format}`);
            }
            const func = handler.build;
            if (typeof func !== "function") {
                throw new TypeError(`Subtitle format does not support 'build' op: ${format}`);
            }
            return func(captions, options);
        };
        /**
         * Converts subtitle format.
         * @param content The subtitle content
         * @param options The conversion options
         * @returns The converted subtitle content
         */
        this.convert = (content, _options = {}) => {
            var _a;
            let options = {};
            if (typeof _options === "string") {
                options.to = _options;
            }
            else {
                options = _options;
            }
            const parseOptions = {
                format: (_a = options.from) !== null && _a !== void 0 ? _a : undefined,
                verbose: options.verbose,
                eol: options.eol,
            };
            let captions = this.parse(content, parseOptions);
            if (options.resync) {
                captions = this.resync(captions, options.resync);
            }
            const buildOptions = {
                format: options.to || options.format,
                verbose: options.verbose,
                eol: options.eol,
            };
            const result = this.build(captions, buildOptions);
            return result;
        };
        /**
         * Shifts the time of the captions.
         * @param captions The captions to resync
         * @param options The resync options
         * @throws {TypeError} If the 'options' argument is not defined
         * @returns The resynced captions
         */
        // skipcq: JS-0105
        this.resync = (captions, options = {}) => {
            var _a, _b, _c, _d;
            let func, ratio, frame = false, offset;
            if (typeof options === "function") {
                func = options; // User's function to handle time shift
            }
            else if (typeof options === "number") {
                offset = options; // Time shift (+/- offset)
                func = (a) => [a[0] + offset, a[1] + offset];
            }
            else if (typeof options === "object") {
                offset = ((_a = options.offset) !== null && _a !== void 0 ? _a : 0) * (options.frame ? (_b = options.fps) !== null && _b !== void 0 ? _b : 25 : 1);
                ratio = (_c = options.ratio) !== null && _c !== void 0 ? _c : 1.0;
                frame = (_d = options.frame) !== null && _d !== void 0 ? _d : false;
                func = (a) => [Math.round(a[0] * ratio + offset), Math.round(a[1] * ratio + offset)];
            }
            else {
                throw new TypeError("Argument 'options' not defined");
            }
            const resynced = [];
            for (const _caption of captions) {
                const caption = clone(_caption);
                if (!caption.type || caption.type === "caption") {
                    if (frame && caption.frame) {
                        const shift = func([caption.frame.start, caption.frame.end]);
                        if (shift && shift.length === 2) {
                            caption.frame.start = shift[0];
                            caption.frame.end = shift[1];
                            caption.frame.count = caption.frame.end - caption.frame.start;
                        }
                    }
                    else {
                        const shift = func([caption.start, caption.end]);
                        if (shift && shift.length === 2) {
                            caption.start = shift[0];
                            caption.end = shift[1];
                            caption.duration = caption.end - caption.start;
                        }
                    }
                }
                resynced.push(caption);
            }
            return resynced;
        };
    }
}
const subsrt = new Subsrt();
module.exports.default = subsrt;
module.exports['format'] = subsrt['format'];
module.exports['list'] = subsrt['list'];
module.exports['detect'] = subsrt['detect'];
module.exports['parse'] = subsrt['parse'];
module.exports['build'] = subsrt['build'];
module.exports['convert'] = subsrt['convert'];
module.exports['resync'] = subsrt['resync'];
});

window.Subsrt = __req('subsrt.js').default;
})(typeof window !== 'undefined' ? window : globalThis);
