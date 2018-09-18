var rp = require('request-promise');
var historyWriter = require('./historyWriter.js');
var notTransmittingHandlers = [];
var FbCentralProjectURL = 'https://centralstationv2.firebaseio.com/'
exports.updateFirebaseAsync = async function (reading) {
    reading.zone = reading.zoneCode;
    await updateCurrentTemperatureAsync(reading.zoneCode, reading);
    await writeIntervalsHistoryAsync(reading.zoneCode, reading);
    if (reading.zoneCode in notTransmittingHandlers) {
        clearInterval(notTransmittingHandlers[reading.zoneCode]);
    }
    var handler = setInterval(function () {
        notifySensorDidNotTransmitAsync(reading.zoneCode);
    }, 1000 * 60);
    notTransmittingHandlers[reading.zoneCode] = handler;
    return;


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
        var currentCoverage = await getCurrentZoneCoverageAsync(zoneCode);
        var newCoverage = currentCoverage + '0';
        newCoverage = newCoverage.substring(newCoverage.length - 5, newCoverage.length);
        await updateNewCoverageAsync(zoneCode, newCoverage);

    }




}