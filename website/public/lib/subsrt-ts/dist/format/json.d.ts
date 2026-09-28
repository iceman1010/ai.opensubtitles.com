import { BuildOptions, Caption, ParseOptions } from "../types/handler.js";
declare const FORMAT_NAME = "json";
/**
 * Parses captions in JSON format.
 * @param content The subtitle content
 * @param _options Parse options
 * @returns Parsed captions
 */
declare const parse: (content: string, _options: ParseOptions) => Caption[];
/**
 * Builds captions in JSON format.
 * @param captions The captions to build
 * @param _options Build options
 * @returns The built captions string in JSON format
 */
declare const build: (captions: Caption[], _options: BuildOptions) => string;
/**
 * Detects whether the content is in JSON format.
 * @param content The subtitle content
 * @returns Whether the content is in JSON format
 */
declare const detect: (content: string) => boolean;
declare const _default: import("../handler.js").Handler;
export default _default;
export { FORMAT_NAME as name, build, detect, parse };
