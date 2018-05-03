/// <reference types="node" />
import latte_require from "latte_require";
import * as latte_lib from "latte_lib";
export interface LoadEvent {
    event: string;
}
export interface LoadConfig {
    reloadTime: number;
    loadPath: string[];
}
export default class Load extends latte_lib.events {
    config: any;
    require: latte_require;
    watchers: MapConstructor;
    reloadList: LoadEvent[];
    constructor(config: LoadConfig);
    init(): void;
    reload(e: LoadEvent): void;
    loadFile(path: string): void;
    loadDir(path: string): void;
    clean(): void;
    static create(config: LoadConfig): Load;
}
