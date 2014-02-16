var _ = require('underscore');

var NormalTroop = function(name, baseData, levelData){
    this._name = name;
    this._isDard = false;
    this._baseData = _.extend({
        SPACE: false,
        TIME: false,
    }, baseData);
    this._levelData = levelData.map(function(data){
        return _.extend({
            LEVEL: false,
            DAMAGE: false,
            HP: false,
            COST: false,
        }, data);
    });
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

