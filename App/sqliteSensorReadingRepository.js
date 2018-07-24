var zonesdb = require('./zonesDatabase');
exports.insertReadingAsync = async function (reading) {
    await zonesdb.instance().runAsync("REPLACE INTO ZonesTemperature(zoneCode,sensorId,channel,temperature,humidity,timestamp) values ($zoneCode,$sensorId,$channel,$temperature,$humidity,$timestamp)",
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
    var valveData = await zonesdb.instance().allAsync("select zoneCode,temperature,timestamp from ZonesTemperature");
    return valveData;

}