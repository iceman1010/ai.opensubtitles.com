import { BuildOptions, Caption, ConvertOptions, ParseOptions, ResyncOptions } from "./types/handler.js";
import { ResyncFunction, SubsrtInterface } from "./types/subsrt.js";
/**
 * Main subsrt class.
 */
declare class Subsrt implements SubsrtInterface {
    format: import("./types/subsrt.js").SubsrtFormats;
    /**
     * Gets a list of supported subtitle formats.
     * @returns The list of supported subtitle formats
     */
    list: () => string[];
    /**
     * Detects a subtitle format from the content.
     * @param content The subtitle content
     * @returns The detected format
     */
    detect: (content: string) => string;
    /**
     * Parses a subtitle content.
     * @param content The subtitle content
     * @param options The parsing options
     * @throws {TypeError} If the format cannot be determined
     * @throws {TypeError} If the format is not supported
     * @throws {TypeError} If the handler does not support 'parse' op
     * @returns The parsed captions
     */
    parse: (content: string, options?: ParseOptions) => Caption[];
    /**
     * Builds a subtitle content.
     * @param captions The captions to build
     * @param options The building options
     * @throws {TypeError} If the format cannot be determined
     * @throws {TypeError} If the format is not supported
     * @throws {TypeError} If the handler does not support 'build' op
     * @returns The built subtitle content
     */
    build: (captions: Caption[], options?: BuildOptions) => string;
    /**
     * Converts subtitle format.
     * @param content The subtitle content
     * @param options The conversion options
     * @returns The converted subtitle content
     */
    convert: (content: string, _options?: ConvertOptions | string) => string;
    /**
     * Shifts the time of the captions.
     * @param captions The captions to resync
     * @param options The resync options
     * @throws {TypeError} If the 'options' argument is not defined
     * @returns The resynced captions
     */
    resync: (captions: Caption[], options?: ResyncFunction | number | ResyncOptions) => Caption[];
}
declare const subsrt: Subsrt;
export default subsrt;
export declare const format: import("./types/subsrt.js").SubsrtFormats, list: () => string[], detect: (content: string) => string, parse: (content: string, options?: ParseOptions) => Caption[], build: (captions: Caption[], options?: BuildOptions) => string, convert: (content: string, _options?: ConvertOptions | string) => string, resync: (captions: Caption[], options?: ResyncFunction | number | ResyncOptions) => Caption[];
