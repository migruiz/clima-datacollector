var sqliteDb = require('./db-sqlite.js');
//exports.insertReadingAsync = function (reading) {
//    sqliteDb.database().operateDatabaseAsync(function (db) {
//        db.runAsync("REPLACE INTO ZonesTemperature(zoneCode,sensorId,channel,temperature,humidity,timestamp) values ($zoneCode,$sensorId,$channel,$temperature,$humidity,$timestamp)",
//            {
//                $zoneCode: reading.zoneCode,
//                $sensorId: reading.sensorId,
//                $channel: reading.channel,
//                $temperature: reading.temperature,
//                $humidity: reading.humidity,
//                $timestamp: reading.timeStamp
//            });
//    });
//}
//exports.getCurrentReadingsAsync = function () {
//    var result = sqliteDb.database().operateDatabaseAsync(function (db) {
//        var valveData = await(db.allAsync("select zoneCode,temperature,timestamp from ZonesTemperature"));
//        return valveData;
//    });
//    return result;
//}