var zonesdb = require('./zonesDatabase');
exports.insertReadingAsync = async function (data) {
    await zonesdb.instance().operate(db=>db.runAsync("REPLACE INTO ZonesTemperature(zoneCode,sensorId,channel,temperature,humidity,timestamp) values ($zoneCode,$sensorId,$channel,$temperature,$humidity,$timestamp)",
        {
            $zoneCode: data.zoneCode,
            $sensorId: data.sensorId,
            $channel: data.channel,
            $temperature: data.temperature,
            $humidity: data.humidity,
            $timestamp: data.timeStamp
        }));
}
exports.insertHistoryAsync = async function (zoneCode,lastIntervalStartTime,data) {
    await zonesdb.instance().operate(db=>db.runAsync("INSERT INTO ZonesHistory(zoneCode,temperature,humidity,readings,timestamp) values ($zoneCode,$temperature,$humidity,$readings,$timestamp)",
        {
            $zoneCode: zoneCode,
            $readings: data.readings,
            $temperature: data.temperature,
            $humidity: data.humidity,
            $timestamp: lastIntervalStartTime
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