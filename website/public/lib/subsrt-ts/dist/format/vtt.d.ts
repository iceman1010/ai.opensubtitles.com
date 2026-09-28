import { BuildOptions, Caption, ParseOptions } from "../types/handler.js";
declare const FORMAT_NAME = "vtt";
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
 * Parses captions in WebVTT format (Web Video Text Tracks Format).
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 */
declare const parse: (content: string, options: ParseOptions) => Caption[];
/**
 * Builds captions in WebVTT format (Web Video Text Tracks Format).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in WebVTT format
 */
declare const build: (captions: Caption[], options: BuildOptions) => string;
/**
 * Detects whether the content is in WebVTT format.
 * @param content The subtitle content
 * @returns Whether the content is in WebVTT format
 */
declare const detect: (content: string) => boolean;
declare const _default: import("../handler.js").Handler;
export default _default;
export { FORMAT_NAME as name, build, detect, helper, parse };
