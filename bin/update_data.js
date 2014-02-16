var Builder = require('./Builder');
var fs = require('fs');

var DEST_FILE = __dirname + '/../public/json/data.json' ;

var builder = new Builder();

builder.createAllD()
.spread(function(){
    var json = JSON.stringify(builder.toObject());
    console.log('json', json);
    fs.writeFile(DEST_FILE, json , function (err) {
        if( !err ){
            console.log('success');
        }
    });
});
