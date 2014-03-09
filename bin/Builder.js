var _ = require('underscore');
var NormalTroop = require('./NormalTroop');
var DarkTroop = require('./DarkTroop');

var request = require('request');
var cheerio = require('cheerio');
var util = require('util');
var Q = require('q');

var BASE_URL = 'http://clashofclans.wikia.com/wiki/',
    NORMAL_TROOPS = [
        'Barbarian',
        'Archer',
        'Goblin',
        'Giant',
        'Wall Breaker',
        'Balloon',
        'Wizard',
        'Healer',
        'Dragon',
        'P.E.K.K.A',
    ],
    DARK_TROOPS = [
        'Minion',
        'Hog Rider',
        'Valkyrie',
        'Golem',
        'Witch',
    ],
    TROOPS_TO_COLUMNS = NORMAL_TROOPS.concat(DARK_TROOPS).reduce(function(rt, troop){
        rt[troop] = {
            BASE: {
                SPACE:  'Housing Space',
                TIME:   'Training Time',
            },
            LEVEL: {
                LEVEL:      'Level',
                DAMAGE:     'Damage per Second',
                HP:         'Hitpoints',
                COST:       'Training Cost',
            },
        };
        if( troop === 'Wall Breaker' ){
            rt[troop].LEVEL.DAMAGE = 'Damage vs. Walls';
        }
        else if( troop === 'Healer' ){
            delete rt[troop].LEVEL.DAMAGE;
        }
        else if( troop === 'Witch' ){
            rt[troop].LEVEL.DAMAGE = 'Damage Per Second';
        }
        return rt;

    }, {}),
    renameObjectKey = function(obj, orgToDest){
        return _.keys(obj).reduce(function(rt, orgKey){
            rt[orgToDest[orgKey]] = obj[orgKey];
            return rt;
        }, {});
    };


var Builder = function(){
    this._normalTroops = [];
    this._darkTroops = [];
    this._getHtmlIndex = 0;
};

_.extend(Builder.prototype, {
    toObject: function(){
        var troops = this._normalTroops.concat(this._darkTroops);
        return troops.map(function(troop){ return troop.toObject(); });
    },
    createAllD: function(){
        return Q.allSettled([
            this.createTroopsD(NORMAL_TROOPS, NormalTroop)
                .then(function(troopList){
                    this._normalTroops = troopList.map(function(troop){
                        var data;
                        if( troop.getName()==='Wall Breaker' ){
                            data = troop.getLevelData();
                            data = data.map(function(d){
                                d.DAMAGE /= 40;
                                return d;
                            });
                        }
                        return troop;
                    });
                    return Q.defer().resolve().promise;
                }.bind(this)),
            this.createTroopsD(DARK_TROOPS, DarkTroop)
                .then(function(troopList){
                    this._darkTroops = troopList;
                    return Q.defer().resolve().promise;
                }.bind(this)),
        ]);
    },
    createTroopsD: function(troops, Troop){
        return Q.allSettled(troops.map(function(troop){
            return this.getHtmlD(troop)
                .then(function(body){
                    return this.parseHtmlD(
                        body,
                        _.values(TROOPS_TO_COLUMNS[troop].BASE),
                        _.values(TROOPS_TO_COLUMNS[troop].LEVEL)
                    );
                }.bind(this));
        }.bind(this)))
        .spread(function(){
            var dfd = Q.defer();
            var troopList = [];
            [].slice.apply(arguments).forEach(function(result, i){
                console.log(troops[i], !!result.value);
                var baseData = result.value.base,
                    levelData = result.value.level;

                if( baseData.length !== 1 ){
                    console.log('invalid');
                }
                baseData = baseData.pop();
                baseData = renameObjectKey(baseData, _.invert(TROOPS_TO_COLUMNS[troops[i]].BASE));
                for( var key in baseData ){
                    if( key === 'TIME' && baseData[key].match(/^\d+m$/) ){
                        baseData[key] = parseInt(baseData[key], 10) * 60;
                    }
                    else {
                        baseData[key] = parseInt(baseData[key], 10);
                    }
                }
                levelData = levelData.map(function(data){
                    data = renameObjectKey(data, _.invert(TROOPS_TO_COLUMNS[troops[i]].LEVEL));
                    for( var key in data ){
                        data[key] = parseInt(data[key], 10);
                    }
                    return data;
                });
                var troop = new Troop(troops[i], baseData, levelData);
                troopList.push(troop);
            }.bind(this));

            dfd.resolve(troopList);
            return dfd.promise;
        }.bind(this));
    },

    getHtmlD: function(troop){
        var dfd = Q.defer();
        setTimeout(function(){
            request.get({
                url: BASE_URL + troop,
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    dfd.resolve(body);
                } else {
                    console.log('error: '+ response.statusCode);
                }
            });
        }, 1000 * this._getHtmlIndex++);
        return dfd.promise;
    },

    parseHtmlD: function(body, baseColumns, levelColumns){
        var $ = cheerio.load(body),
            $baseTable, $levelTable;
        var dfd = Q.defer();
        $('table.wikitable').each(function(i, table){
            var $table = $(table);
            if( baseColumns.every(
                function(clm){
                    return $table.text().indexOf(clm) !== -1;
                }
            )){
                $baseTable = $table;
            }
            else if( levelColumns.every(
                function(clm){
                    return $table.text().indexOf(clm) !== -1;
                }
            )){
                $levelTable = $table;
            }
        });

        if( !$baseTable || !$levelTable ){
            console.log('invalid html', !!$baseTable, !!$levelTable);
        }

        var baseData = this.parseTable(baseColumns, $baseTable, $);
        var levelData = this.parseTable(levelColumns, $levelTable, $);
        dfd.resolve({
            base: baseData,
            level: levelData,
        });
        return dfd.promise;
    },

    parseTable: function(clms, $table, $){
        var indexToClm = {};
        $table.find('tr').eq(0).find('th').each(function(i, th){
            var text = $(th).text().replace(/(^\s*)|\n|(\s*$)/g, '');
            if( clms.indexOf(text) !== -1 ){
                indexToClm[i] = text;
            }
        });
        var dataList = [];
        $table.find('tr').each(function(i, tr){
            var data = null;
            $(tr).find('td').each(function(j, td){
                if( j in indexToClm ){
                    data || (data={});
                    var text = $(td).text().replace(/(\n|,)/g, '');
                    data[indexToClm[j]] = text;
                }
            });

            data && dataList.push(data);
        });
        return dataList;
    },
});


module.exports = Builder;
