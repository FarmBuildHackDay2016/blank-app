var csv = require('csv');
var fs = require('fs');
var moment =require('moment');

var DATA_PATH = __dirname + '/../data/';

var WEATHER_STATION = '081096';
var BOM_PRODUCT = 'IDCJAC0016';
var YEAR = 2016;
function parse(filename) {
  return new Promise(function (resolve, reject) {

    var data = fs.readFileSync(filename);

    csv.parse(data, function(err, data){
      var array = data.map(function(data, i){
        if (data[0] !== 'Product code') {

          var time = moment(data[2] + data[3] + data[4],'YYYY-MM-DD');

          return {
            date: time,
            solar: data[5]
          }
        }
      }).filter(function (row) {
        return row;
      });
      resolve(JSON.stringify(array));
    });
  });
}

function convert (stationId) {
  stationId = stationId || WEATHER_STATION;

  var path = DATA_PATH + BOM_PRODUCT + '_' + stationId +  '_' + YEAR + '_Data.';
  parse(path + 'csv').then(function (data) {
    console.log('the data is : ' + data);
    fs.writeFileSync(path + 'json', data);
  }).catch(function (err) {
    console.log('error occurred: ' + (err.stack || err));
  });

}
convert();

module.exports = parse;