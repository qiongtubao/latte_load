
let latte_load = require('../lib/index');
let Load = latte_load.default;
let load = new Load({
  reloadTime: 1000,
  loadPath: ['../test']
});