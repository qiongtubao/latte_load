var latte_verify = require("latte_verify");
var Modules = require("latte_require");
var latte_lib = require("latte_lib");
var latte_watch = require("latte_watch");
var fs = require("fs");
var defaultConfig = {
	reloadTime: 1000
};
var verifyConfig = {
	type: "object",
	properties: {
		loadPath: {
			type: "array",
			force: true,
			verify: function(path) {
				return latte_lib.fs.existsSync(path);
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
var Load = function(config){

	this.config = latte_verify.verify(config, verifyConfig);
	this.require  = null;
	this.init();
};
latte_lib.extends(Load, latte_lib.events);
(function() {
	this.init = function() {
		this.require = Modules.create("./");
		if(!this.config.loadPath.length) {
			return;
		}
		
		this.watchers = {};
		var self = this;
		this.config.loadPath.forEach(function(path) {

			self.loadDir(path);
			var watcher = latte_watch.create(path);
			watcher.on("addDir", function(addDirName) {
				self.loadDir(addDirName);
			});
			watcher.on("unlink", function() {
				self.reload({
					event: "unlink"
				});
			});
			watcher.on("unlinkDir", function() {
				self.reload({
					event: "unlinkDir"
				});
			});
			watcher.on("add", function(filename) {
				self.loadFile(filename);
			});
			watcher.on("change", function() {
				console.log("change");
				self.reload({
					event: "fileChange"
				});
			});	
			self.watchers[path ] =watcher;
		});

	}
	this.loadDir  = function(path) {
		var self = this;
		var files = latte_lib.fs.readdirSync(path);
		files.forEach(function(filename) {
			var stat = latte_lib.fs.statSync(path + "/"+filename);
			if(stat.isFile()) {
				self.loadFile(path + "/" + filename);
			}else if(stat.isDirectory()) {
				//console.log(path , filename);
				self.loadDir(path + "/" + filename);
			}
		});
	}
	this.loadFile = function(path) {
		var self = this;
		var o;
		try {
			if(path[0] == "/") {
				o = self.require.require(path);
			}else{
				o = self.require.require("./" + path);
			}
			
		}catch(err) {
			console.log(err);
			self.emit("loadError", path, err);
			return;
		}
		this.load(path, o);
	}
	this.reload = function(event) {
		this.reloadList = this.reloadList || [];
		this.reloadList.push(event);
		if(this.reloadList.length > 1) {
			return;
		}
		var self = this;
		setTimeout(function() {
			//self.require = Modules.create("./");
			self.clean();
			self.init();
		}, self.config.reloadTime);
	}
	this.clean = function() {
		this.require = null;
		for(var i in this.watchers) {
			this.watchers[i].close();
		}
		this.watchers = {};
	}
}).call(Load.prototype);
module.exports = Load;