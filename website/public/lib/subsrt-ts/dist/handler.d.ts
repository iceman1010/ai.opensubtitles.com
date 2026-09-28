import { BaseHandler, BuildFunction, DetectFunction, Helper, ParseFunction } from "./types/handler.js";
/**
 * Handler class.
 */
export declare class Handler implements BaseHandler {
    name: string;
    helper?: Helper;
    build: BuildFunction;
    detect: DetectFunction;
    parse: ParseFunction;
    /**
     * Creates a new handler.
     * @param args The handler properties (`name`, `build`, `detect`, `helper` and `parse`)
     * @see
     * - {@link BaseHandler}
     * - {@link BuildFunction}
     * - {@link DetectFunction}
     * - {@link Helper}
     * - {@link ParseFunction}
     * - {@link ParseOptions}
     * @example
     * ```ts
     * const handler = new Handler({
     *     name: "ext",
     *     build: (captions: Caption[], options: BuildOptions): string => {
     *         // ...
     *     },
     *     detect: (content: string): boolean | string => {
     *         // ...
     *     },
     *     parse: (content: string, options: ParseOptions): Caption[] => {
     *         // ...
     *     },
     * });
     * ```
     */
    constructor({ name, build, detect, helper, parse }: BaseHandler);
}
/**
 * Build a handler.
 * @param args The handler properties
 * @returns The handler
 * @see {@link Handler}
 */
export declare const buildHandler: (args: BaseHandler) => Handler;
