import { buildHandler } from "../handler.js";
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
export default buildHandler({ name: FORMAT_NAME, build, detect, parse });
export { FORMAT_NAME as name, build, detect, parse };
