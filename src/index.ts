import latte_verify from "latte_verify"
import latte_require from "latte_require"
import * as latte_lib from "latte_lib"
import latte_watch from "latte_watch"
import * as node_fs from "fs"
let defaultConfig = {
  reloadTime: 1000
};
let verifyConfig = {
  type: "object",
  properties: {
    loadPath: {
      type: "array",
      force: true,
      verify: (path) => {
        return node_fs.existsSync(path);
      }
    },
    reloadTime: {
      type: "integer",
      default: defaultConfig.reloadTime
    }
  },
  default: {
    reloadTime: defaultConfig.reloadTime,
    loadPath: []
  }
};
export interface LoadEvent {
  event: string;
};
export interface LoadConfig {
  reloadTime: number;
  loadPath: string[];
};
export default class Load extends latte_lib.events {
  config: any;
  require: latte_require;
  watchers: MapConstructor;
  reloadList: LoadEvent[];
  constructor(config: LoadConfig) {
    super();
    this.config = config;
    this.init();
  }
  init() {
    this.require = latte_require.create(__filename);
    if (!this.config.loadPath.length) {
      return;
    }
    this.watchers = {};
    this.reloadList = [];
    this.config.loadPath.forEach((path) => {
      this.loadDir(path);
      let watcher = latte_watch.create(path);
      watcher.on("unlinkDir", () => {
        this.reload({
          event: "unlinkDir"
        });
      });
      watcher.on("add", (filename) => {
        this.loadFile(filename);
      });
      watcher.on("change", () => {
        console.log("change");
        this.reload({
          event: "fileChange"
        });
      });
      this.watchers[path] = watcher;
    });
  }
  reload(e: LoadEvent) {
    this.reloadList.push(e);
    if (this.reloadList.length > 1) {
      return;
    }
    setTimeout(() => {
      this.clean();
      this.init();
    }, this.config.reloadTime);
  }
  loadFile(path: string) {
    let o;
    try {
      if (path[0] == "/") {
        o = this.require.require(path);
      } else {
        o = this.require.require("./" + path);
      }
    } catch (err) {
      this.emit("loadError", path, err);
      return;
    }
    this.require.require(path);
  }
  loadDir(path: string) {
    node_fs.readdirSync(path).forEach((filename) => {
      let stat = node_fs.statSync(path + '/' + filename);
      if (stat.isFile()) {
        this.loadFile(path + "/" + filename);
      } else if (stat.isDirectory()) {
        this.loadDir(path + "/" + filename);
      }
    });
  }
  clean() {
    this.require = null;
    for (let i in this.watchers) {
      this.watchers[i].close();
    }
    this.watchers = {};
  }
  static create(config: LoadConfig) {
    return new Load(config);
  }
}

