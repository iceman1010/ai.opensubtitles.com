import { Caption, ContentCaption } from "../types/handler.js";
import { SUBBuildOptions, SUBParseOptions } from "./types/sub.js";
declare const FORMAT_NAME = "sub";
/**
 * Parses captions in MicroDVD format.
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 * @see https://en.wikipedia.org/wiki/MicroDVD
 */
declare const parse: (content: string, options: SUBParseOptions) => ContentCaption[];
/**
 * Builds captions in MicroDVD format.
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in MicroDVD format
 * @see https://en.wikipedia.org/wiki/MicroDVD
 */
declare const build: (captions: Caption[], options: SUBBuildOptions) => string;
/**
 * Detects whether the content is in MicroDVD format.
 * @param content The subtitle content
 * @returns Whether it's MicroDVD format
 */
declare const detect: (content: string) => boolean;
declare const _default: import("../handler.js").Handler;
export default _default;
export { FORMAT_NAME as name, build, detect, parse };
