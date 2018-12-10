exports.writeHistoryAsync = async function (input) {
    var rp = require('request-promise');
    var FbCentralProjectURL = 'https://centralstationv2.firebaseio.com/'
    var reading = input.reading;
    var resolution = input.resolution;
    var zoneCode = input.zoneCode;


    var nearestStamp = Math.floor(reading.timeStamp / resolution) * resolution;

    function getIntervalDataAsync() {
        var url = FbCentralProjectURL + 'history/' + zoneCode + '/' + resolution.toString() + '/' + nearestStamp + '.json';
        return rp({
            url: url,
            method: 'GET',
            json: true
        });
    }
    function updateIntervalDataAsync(intervalData) {
        var url = FbCentralProjectURL + 'history/' + zoneCode + '/' + resolution.toString() + '/' + nearestStamp + '.json';
        return rp({
            url: url,
            method: 'PUT',
            json: intervalData
        });
    }

    var intervalData = await getIntervalDataAsync();
    if (intervalData) {
        intervalData.readingsCount = intervalData.readingsCount + 1;
        intervalData.temperatureSum = intervalData.temperatureSum + reading.temperature;
        intervalData.temperatureAvg = intervalData.temperatureSum / intervalData.readingsCount;
        if (reading.temperature > intervalData.temperatureMax) {
            intervalData.temperatureMax = reading.temperature;
            intervalData.temperatureMaxTimeStamp = reading.timeStamp;
        }
        if (reading.temperature < intervalData.temperatureMin) {
            intervalData.temperatureMin = reading.temperature;
            intervalData.temperatureMinTimeStamp = reading.timeStamp;
        }
        intervalData.humiditySum = intervalData.humiditySum + reading.humidity;
        intervalData.humidityAvg = intervalData.humiditySum / intervalData.readingsCount;
        if (reading.humidity > intervalData.humidityMax) {
            intervalData.humidityMax = reading.humidity;
            intervalData.humidityMaxTimeStamp = reading.timeStamp;
        }
        if (reading.humidity < intervalData.humidityMin) {
            intervalData.humidityMin = reading.humidity;
            intervalData.humidityMinTimeStamp = reading.timeStamp;
        }
        await updateIntervalDataAsync(intervalData);
    }
    else {
        intervalData = {
            temperatureSum: reading.temperature,
            temperatureMax: reading.temperature,
            temperatureMaxTimeStamp: reading.timeStamp,
            temperatureMin: reading.temperature,
            temperatureMinTimeStamp: reading.timeStamp,
            temperatureAvg: reading.temperature,
            humiditySum: reading.humidity,
            humiditySum: reading.humidity,
            humidityMax: reading.humidity,
            humidityMaxTimeStamp: reading.timeStamp,
            humidityMin: reading.humidity,
            humidityMinTimeStamp: reading.timeStamp,
            humidityAvg: reading.humidity,
            readingsCount: 1,


        };
        await updateIntervalDataAsync(intervalData);
    }







}