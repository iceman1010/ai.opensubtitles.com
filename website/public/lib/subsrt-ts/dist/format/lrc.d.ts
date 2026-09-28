import { BuildOptions, Caption, ContentCaption, MetaCaption, ParseOptions } from "../types/handler.js";
declare const FORMAT_NAME = "lrc";
declare const helper: {
    /**
     * Converts a time string in format of mm:ss.ff or mm:ss,ff to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s: string) => number;
    /**
     * Converts milliseconds to a time string in format of mm:ss.ff.
     * @param ms Milliseconds
     * @returns Time string in format of mm:ss.ff
     */
    toTimeString: (ms: number) => string;
};
/**
 * Parses captions in LRC format.
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 * @see https://en.wikipedia.org/wiki/LRC_%28file_format%29
 */
declare const parse: (content: string, options: ParseOptions) => (ContentCaption | MetaCaption)[];
/**
 * Builds captions in LRC format.
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in LRC format
 * @see https://en.wikipedia.org/wiki/LRC_%28file_format%29
 */
declare const build: (captions: Caption[], options: BuildOptions) => string;
/**
 * Detects whether the content is in LRC format.
 * @param content The subtitle content
 * @returns Format name if detected, or null if not detected
 */
declare const detect: (content: string) => boolean;
declare const _default: import("../handler.js").Handler;
export default _default;
export { FORMAT_NAME as name, build, detect, helper, parse };
