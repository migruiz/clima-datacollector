var db = require('./db-sqlite.js').database();
var db2 = require('./db-sqlite.js').database();
exports.insertReadingAsync =async function (reading) {

    await db.runAsync("REPLACE INTO ZonesTemperature(zoneCode,sensorId,channel,temperature,humidity,timestamp) values ($zoneCode,$sensorId,$channel,$temperature,$humidity,$timestamp)",
        {
            $zoneCode: reading.zoneCode,
            $sensorId: reading.sensorId,
            $channel: reading.channel,
            $temperature: reading.temperature,
            $humidity: reading.humidity,
            $timestamp: reading.timeStamp
        });
}
exports.getCurrentReadingsAsync =async  function () {
    var valveData = await db.allAsync("select zoneCode,temperature,timestamp from ZonesTemperature");
    return valveData;

}