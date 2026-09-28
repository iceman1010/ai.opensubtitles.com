import { BuildOptions, Caption, ContentCaption, MetaCaption, ParseOptions, StyleCaption } from "../types/handler.js";
declare const FORMAT_NAME = "ssa";
declare const helper: {
    /**
     * Converts a time string in format of hh:mm:ss.fff or hh:mm:ss,fff to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s: string) => number;
    /**
     * Converts milliseconds to a time string in format of hh:mm:ss.fff.
     * @param ms Milliseconds
     * @returns Time string in format of hh:mm:ss.fff
     */
    toTimeString: (ms: number) => string;
};
/**
 * Parses captions in SubStation Alpha format (.ssa).
 * @param content The subtitle content
 * @param options Parse options
 * @throws {TypeError} If the meta data is in invalid format
 * @returns Parsed captions
 */
declare const parse: (content: string, options: ParseOptions) => (ContentCaption | MetaCaption | StyleCaption)[];
/**
 * Builds captions in SubStation Alpha format (.ssa).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SubStation Alpha format
 */
declare const build: (captions: Caption[], options: BuildOptions) => string;
/**
 * Detects whether the content is in ASS or SSA format.
 * @param content The subtitle content
 * @returns Whether the content is in "ass", "ssa" or neither
 */
declare const detect: (content: string) => false | "ssa" | "ass";
declare const _default: import("../handler.js").Handler;
export default _default;
export { FORMAT_NAME as name, build, detect, helper, parse };
