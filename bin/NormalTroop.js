var _ = require('underscore');
var NormalTroop = function(name, baseData, levelData){
    this._name = name;
    this._isDard = false;
    this._baseData = baseData;
    this._levelData = levelData;
};

_.extend(NormalTroop.prototype, {
    toObject: function(){
        return {
            base: this._baseData,
            level: this._levelData,
            isDark: this._isDark,
        };
    },
});

module.exports = NormalTroop;

