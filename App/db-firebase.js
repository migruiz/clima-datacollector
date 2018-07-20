var rp = require('request-promise');
var historyWriter = require('./historyWriter.js');
var notTransmittingHandlers = [];
var FbCentralProjectURL = 'https://centralstation-cdc47.firebaseio.com/'
exports.updateFirebaseAsync = async function (reading) {
    console.log("updating firebase");

    var zoneInfo = await getZoneInfo(reading.sensorId);
    if (!zoneInfo)
        return;
    await insertReadingAsync(zoneInfo.FbProjectURL, reading);
    var currentCoverage = await getCurrentZoneCoverageAsync(zoneInfo.ZoneCode);
    var newCoverage = '00001';
    if (currentCoverage) {
        newCoverage = currentCoverage + '1';
        newCoverage = newCoverage.substring(newCoverage.length - 5, newCoverage.length);
    }
    reading.zone = zoneInfo.ZoneCode;
    reading.coverage = newCoverage;
    reading.coverageInt = (newCoverage.match(/1/g) || []).length;
    await updateCurrentTemperatureAsync(zoneInfo.ZoneCode, reading);
    await writeIntervalsHistoryAsync(zoneInfo.ZoneCode, reading);
    if (zoneInfo.ZoneCode in notTransmittingHandlers) {
        clearInterval(notTransmittingHandlers[zoneInfo.ZoneCode]);
    }
    var handler = setInterval(function () {
        notifySensorDidNotTransmit(zoneInfo.ZoneCode);
    }, 1000 * 60);
    notTransmittingHandlers[zoneInfo.ZoneCode] = handler;
    return;

    function getZoneInfoAsync(sensorId) {
        return rp({
            url: FbCentralProjectURL + 'sensorsmap/' + sensorId + '.json',
            method: 'GET',
            json: true
        });
    }
    function getCurrentZoneCoverageAsync(zoneCode) {
        return rp({
            url: FbCentralProjectURL + 'zones/' + zoneCode + '/coverage.json',
            method: 'GET',
            json: true
        });
    }
    function getPreviousHistoryReadingAsync(zoneCode, resolution, timestamp) {
        return rp({
            url: FbCentralProjectURL + 'history/' + zoneCode + '/' + resolution + '/' + timestamp + '.json',
            method: 'GET',
            json: true
        });
    }
    function insertReadingAsync(zoneProjectURL, reading) {
        return rp({
            url: zoneProjectURL + 'readings/' + reading.timeStamp.toString() + '.json',
            method: 'PUT',
            json: reading
        });
    }
    function updateCurrentTemperatureAsync(zoneCode, reading) {
        return rp({
            url: FbCentralProjectURL + 'zones/' + zoneCode + '.json',
            method: 'PUT',
            json: reading
        })
    }

    function updateNewCoverageAsync(zoneCode, coverage) {
        return rp({
            url: FbCentralProjectURL + 'zones/' + zoneCode + '/coverage.json',
            method: 'PUT',
            json: coverage
        });
    }
    async function writeIntervalsHistoryAsync(zoneCode, reading) {

        await historyWriter.writeHistoryAsync({
            zoneCode: zoneCode,
            reading: reading,
            resolution: 60 * 10
        });
        await historyWriter.writeHistoryAsync({
            zoneCode: zoneCode,
            reading: reading,
            resolution: 60 * 60
        });
        await historyWriter.writeHistoryAsync({
            zoneCode: zoneCode,
            reading: reading,
            resolution: 60 * 60 * 24
        });
    }

    async function notifySensorDidNotTransmitAsync(zoneCode) {
        var currentCoverage = await getCurrentZoneCoverageAsync(myZoneCode);
        var newCoverage = currentCoverage + '0';
        newCoverage = newCoverage.substring(newCoverage.length - 5, newCoverage.length);
        await updateNewCoverageAsync(myZoneCode, newCoverage);

    }




}