import { buildHandler } from "../handler.js";
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
export default buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
export { FORMAT_NAME as name, build, detect, helper, parse };
