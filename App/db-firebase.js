var rp = require('request-promise');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var historyWriter = require('./historyWriter.js');
var notTransmittingHandlers = [];
var FbCentralProjectURL = 'https://centralstation-cdc47.firebaseio.com/'
exports.updateFirebaseAsync = function (reading) {


    var zoneInfo = await(getZoneInfo(reading.sensorId));
    if (!zoneInfo)
        return;
    await(insertReading(zoneInfo.FbProjectURL, reading));
    var currentCoverage = await(getCurrentZoneCoverage(zoneInfo.ZoneCode));
    var newCoverage = '00001';
    if (currentCoverage) {
        newCoverage = currentCoverage + '1';
        newCoverage = newCoverage.substring(newCoverage.length - 5, newCoverage.length);
    }
    reading.zone = zoneInfo.ZoneCode;
    reading.coverage = newCoverage;
    reading.coverageInt = (newCoverage.match(/1/g) || []).length;
    await(updateCurrentTemperature(zoneInfo.ZoneCode, reading));
    await(writeIntervalsHistoryAsync(zoneInfo.ZoneCode, reading)());
    if (zoneInfo.ZoneCode in notTransmittingHandlers) {
        clearInterval(notTransmittingHandlers[zoneInfo.ZoneCode]);
    }
    var handler = setInterval(function () {
        notifySensorDidNotTransmit(zoneInfo.ZoneCode);
    }, 1000 * 60);
    notTransmittingHandlers[zoneInfo.ZoneCode] = handler;
    return;

    function getZoneInfo(sensorId) {
        return rp({
            url: FbCentralProjectURL + 'sensorsmap/' + sensorId + '.json',
            method: 'GET',
            json: true
        });
    }
    function getCurrentZoneCoverage(zoneCode) {
        return rp({
            url: FbCentralProjectURL + 'zones/' + zoneCode + '/coverage.json',
            method: 'GET',
            json: true
        });
    }
    function getPreviousHistoryReading(zoneCode, resolution, timestamp) {
        return rp({
            url: FbCentralProjectURL + 'history/' + zoneCode + '/' + resolution + '/' + timestamp + '.json',
            method: 'GET',
            json: true
        });
    }
    function insertReading(zoneProjectURL, reading) {
        return rp({
            url: zoneProjectURL + 'readings/' + reading.timeStamp.toString() + '.json',
            method: 'PUT',
            json: reading
        });
    }
    function updateCurrentTemperature(zoneCode, reading) {
        return rp({
            url: FbCentralProjectURL + 'zones/' + zoneCode + '.json',
            method: 'PUT',
            json: reading
        })
    }

    function updateNewCoverage(zoneCode, coverage) {
        return rp({
            url: FbCentralProjectURL + 'zones/' + zoneCode + '/coverage.json',
            method: 'PUT',
            json: coverage
        });
    }
    function writeIntervalsHistoryAsync(zoneCode, reading) {
        return async(function () {
            await(historyWriter.writeHistoryAsync({
                zoneCode: zoneCode,
                reading: reading,
                resolution: 60 * 10
            })());
            await(historyWriter.writeHistoryAsync({
                zoneCode: zoneCode,
                reading: reading,
                resolution: 60 * 60
            })());
            await(historyWriter.writeHistoryAsync({
                zoneCode: zoneCode,
                reading: reading,
                resolution: 60 * 60 * 24
            })());
        });
    }

    function notifySensorDidNotTransmit(zoneCode) {
        var innerFx = async(function (myZoneCode) {
            var currentCoverage = await(getCurrentZoneCoverage(myZoneCode));
            var newCoverage = currentCoverage + '0';
            newCoverage = newCoverage.substring(newCoverage.length - 5, newCoverage.length);
            await(updateNewCoverage(myZoneCode, newCoverage));
        });
        innerFx(zoneCode);
    }




}