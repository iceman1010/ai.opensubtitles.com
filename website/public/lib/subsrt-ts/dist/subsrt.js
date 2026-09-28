import formats from "./format/index.js";
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
export default subsrt;
export const { format, list, detect, parse, build, convert, resync } = subsrt;
