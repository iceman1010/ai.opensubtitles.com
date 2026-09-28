import { Caption, ContentCaption, MetaCaption } from "../types/handler.js";
import { SMIBuildOptions, SMIParseOptions } from "./types/smi.js";
declare const FORMAT_NAME = "smi";
declare const helper: {
    /**
     * Encodes a string to be used in XML.
     * @param text - The text to be encoded
     * @returns The HTML-encoded string
     */
    htmlEncode: (text: string) => string;
    /**
     * Decodes a string that has been HTML-encoded.
     * @param html The HTML-encoded string to decode
     * @param eol The end-of-line character to use
     * @returns The decoded string
     */
    htmlDecode: (html: string, eol: string) => string;
};
/**
 * Parses captions in SAMI format (.smi).
 * @param content The subtitle content
 * @param options Parse options
 * @throw {TypeError} When the format is not supported
 * @returns Parsed captions
 */
declare const parse: (content: string, options: SMIParseOptions) => (ContentCaption | MetaCaption)[];
/**
 * Builds captions in SAMI format (.smi).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SAMI format
 */
declare const build: (captions: Caption[], options: SMIBuildOptions) => string;
/**
 * Detects whether the content is in SAMI format.
 * @param content The content to be detected
 * @returns Whether the subtitle format is SAMI
 */
declare const detect: (content: string) => boolean;
declare const _default: import("../handler.js").Handler;
export default _default;
export { FORMAT_NAME as name, build, detect, helper, parse };
