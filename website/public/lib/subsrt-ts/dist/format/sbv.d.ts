import { BuildOptions, Caption, ContentCaption, ParseOptions } from "../types/handler.js";
declare const FORMAT_NAME = "sbv";
declare const helper: {
    /**
     * Converts a time string in format of hh:mm:ss.sss or hh:mm:ss,sss to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s: string) => number;
    /**
     * Converts milliseconds to a time string in format of hh:mm:ss.sss.
     * @param ms Milliseconds
     * @returns Time string in format of hh:mm:ss.sss
     */
    toTimeString: (ms: number) => string;
};
/**
 * Parses captions in SubViewer format (.sbv).
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 */
declare const parse: (content: string, options: ParseOptions) => ContentCaption[];
/**
 * Builds captions in SubViewer format (.sbv).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SubViewer format
 */
declare const build: (captions: Caption[], options: BuildOptions) => string;
/**
 * Detects whether the content is in SubViewer format.
 * @param content The subtitle content
 * @returns Whether the subtitle format is SubViewer
 */
declare const detect: (content: string) => boolean;
declare const _default: import("../handler.js").Handler;
export default _default;
export { FORMAT_NAME as name, build, detect, helper, parse };
