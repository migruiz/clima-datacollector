var zonesdb = require('./zonesDatabase');
exports.insertReadingAsync = async function (reading) {
    await zonesdb.instance().operate(db=>db.runAsync("REPLACE INTO ZonesTemperature(zoneCode,sensorId,channel,temperature,humidity,timestamp) values ($zoneCode,$sensorId,$channel,$temperature,$humidity,$timestamp)",
        {
            $zoneCode: reading.zoneCode,
            $sensorId: reading.sensorId,
            $channel: reading.channel,
            $temperature: reading.temperature,
            $humidity: reading.humidity,
            $timestamp: reading.timeStamp
        }));
}
exports.insertHistoryAsync = async function (zoneCode,data) {
    await zonesdb.instance().operate(db=>db.runAsync("INSERT INTO ZonesHistory(zoneCode,temperature,humidity,readings,timestamp) values ($zoneCode,$temperature,$humidity,$readings,$timestamp)",
        {
            $zoneCode: zoneCode,
            $readings: reading.readings,
            $temperature: reading.temperature,
            $humidity: reading.humidity,
            $timestamp: reading.timeStamp
        }));
}
exports.deleteHistoryAsync = async function (zoneCode,timeStampLimit) {
    await zonesdb.instance().operate(db=>db.runAsync("delete from ZonesHistory where zoneCode=$zoneCode and timestamp<$timeStampLimit",
        {
            $zoneCode: zoneCode,
            $timeStampLimit: timeStampLimit
        }));
}
exports.getCurrentReadingsAsync =async  function () {
    var valveData = await zonesdb.instance().operate(db=>db.allAsync("select zoneCode,temperature,timestamp from ZonesTemperature"));
    return valveData;

}
exports.getHistory =async  function (zoneCode) {
    var valveData = await zonesdb.instance().operate(db=>db.allAsync("select temperature,humidity,readings,timestamp from ZonesHistory where zoneCode=$zoneCode",
    {
        $zoneCode: zoneCode
    }));
    return valveData;

}