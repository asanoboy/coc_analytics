var NormalTroop = require('./NormalTroop');
var util = require('util');

var DarkTroop = function(name, baseData, levelData){
    NormalTroop.call(this, name, baseData, levelData);
    this.isDark = true;
};

util.inherits(DarkTroop, NormalTroop);

module.exports = DarkTroop;
