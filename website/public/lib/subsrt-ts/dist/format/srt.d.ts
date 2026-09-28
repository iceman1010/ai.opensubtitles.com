import { BuildOptions, Caption, ContentCaption, ParseOptions } from "../types/handler.js";
declare const FORMAT_NAME = "srt";
declare const helper: {
    /**
     * Converts a time string in format of hh:mm:ss, hh:mm:ss.sss or hh:mm:ss,sss to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s: string) => number;
    /**
     * Converts milliseconds to a time string in format of hh:mm:ss,sss.
     * @param ms Milliseconds
     * @returns Time string in format of hh:mm:ss,sss
     */
    toTimeString: (ms: number) => string;
};
/**
 * Parses captions in SubRip format (.srt).
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 */
declare const parse: (content: string, options: ParseOptions) => ContentCaption[];
/**
 * Builds captions in SubRip format (.srt).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SubRip format
 */
declare const build: (captions: Caption[], options: BuildOptions) => string;
/**
 * Detects whether the content is in SubRip format.
 * @param content The subtitle content
 * @returns Whether the content is in SubRip format
 */
declare const detect: (content: string) => boolean;
declare const _default: import("../handler.js").Handler;
export default _default;
export { FORMAT_NAME as name, build, detect, helper, parse };
