"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var latte_require_1 = require("latte_require");
var latte_lib = require("latte_lib");
var latte_watch_1 = require("latte_watch");
var node_fs = require("fs");
var defaultConfig = {
    reloadTime: 1000
};
var verifyConfig = {
    type: "object",
    properties: {
        loadPath: {
            type: "array",
            force: true,
            verify: function (path) {
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
;
;
var Load = (function (_super) {
    __extends(Load, _super);
    function Load(config) {
        var _this = _super.call(this) || this;
        _this.config = config;
        _this.init();
        return _this;
    }
    Load.prototype.init = function () {
        var _this = this;
        this.require = latte_require_1.default.create(__filename);
        if (!this.config.loadPath.length) {
            return;
        }
        this.watchers = {};
        this.reloadList = [];
        this.config.loadPath.forEach(function (path) {
            _this.loadDir(path);
            var watcher = latte_watch_1.default.create(path);
            watcher.on("unlinkDir", function () {
                _this.reload({
                    event: "unlinkDir"
                });
            });
            watcher.on("add", function (filename) {
                _this.loadFile(filename);
            });
            watcher.on("change", function () {
                console.log("change");
                _this.reload({
                    event: "fileChange"
                });
            });
            _this.watchers[path] = watcher;
        });
    };
    Load.prototype.reload = function (e) {
        var _this = this;
        this.reloadList.push(e);
        if (this.reloadList.length > 1) {
            return;
        }
        setTimeout(function () {
            _this.clean();
            _this.init();
        }, this.config.reloadTime);
    };
    Load.prototype.loadFile = function (path) {
        var o;
        try {
            if (path[0] == "/") {
                o = this.require.require(path);
            }
            else {
                o = this.require.require("./" + path);
            }
        }
        catch (err) {
            this.emit("loadError", path, err);
            return;
        }
        this.require.require(path);
    };
    Load.prototype.loadDir = function (path) {
        var _this = this;
        node_fs.readdirSync(path).forEach(function (filename) {
            var stat = node_fs.statSync(path + '/' + filename);
            if (stat.isFile()) {
                _this.loadFile(path + "/" + filename);
            }
            else if (stat.isDirectory()) {
                _this.loadDir(path + "/" + filename);
            }
        });
    };
    Load.prototype.clean = function () {
        this.require = null;
        for (var i in this.watchers) {
            this.watchers[i].close();
        }
        this.watchers = {};
    };
    Load.create = function (config) {
        return new Load(config);
    };
    return Load;
}(latte_lib.events));
exports.default = Load;
