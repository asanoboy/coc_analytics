var Builder = require('./Builder');
var fs = require('fs');

var DEST_FILE = __dirname + '/../data.json' ;

var builder = new Builder();

builder.createAllD()
.spread(function(){
    var json = JSON.stringify(builder.toObject());
    fs.writeFile(DEST_FILE, json , function (err) {
        if( !err ){
            console.log('success');
        }
    });
});
