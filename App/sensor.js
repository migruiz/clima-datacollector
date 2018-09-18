var mqtt = require('./mqttCluster.js');
var sqliteRepository = require('./sqliteSensorReadingRepository.js');
var PromiseQueue = require('a-promise-queue');
function Sensor() {




    var messageReadingQueue = new PromiseQueue();
    var lastReading;
    var waitingForOtherSensors;
    var coverageText = "00000";
    this.processNewReadingAsync = async function (sensorReading, piId) {
        return await messageReadingQueue.add(async function () {
            if (waitingForOtherSensors) {
                lastReading.rpi = lastReading.rpi | piId;
            }
            else {
                sensorReading.rpi = piId;
                lastReading = sensorReading;
                waitingForOtherSensors = true;
                setTimeout(() => onAllSensorsReadAsync(), 1000 * 5);
            }
        });
    }
    async function onAllSensorsReadAsync() {

        var newcoverageText = coverageText + lastReading.rpi.toString();
        newcoverageText = newcoverageText.substring(newcoverageText.length - 5, newcoverageText.length);
        coverageText = newcoverageText;
        lastReading.coverage = coverageText;

        waitingForOtherSensors = false;
        await sqliteRepository.insertReadingAsync(lastReading);
        mqtt.cluster().publishData(global.fireBaseReadingTopic, lastReading);
        var zonesReadings = await sqliteRepository.getCurrentReadingsAsync();
        var request = { timestamp: Math.floor(new Date() / 1000), zoneReading: lastReading };
        mqtt.cluster().publishData(global.zonesReadingsTopic, request);
    }



}

exports.newInstance = function () {
    var instance = new Sensor();
    return instance;
}
