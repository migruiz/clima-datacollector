var mqttCluster = require('./mqttCluster.js').cluster();
var sqliteRepository = require('./sqliteSensorReadingRepository.js');

function Sensor(sensorCode) {

    var lastReading;
    var waitingForOtherSensors;
    this.processNewReading = function (sensorReading, piId) {
        if (waitingForOtherSensors) {
            //check stamps maybe it was in the queue.
            lastReading.rpi = lastReading.rpi | piId;
        }
        else {
            sensorReading.rpi = piId;
            lastReading = sensorReading;
            waitingForOtherSensors = true;
            setTimeout(() => reportReadingAfterWaitingForSensorsAsync(lastReading), 1000 * 5);
        }
    }
    async function reportReadingAfterWaitingForSensorsAsync(sensorReading) {
        await sqliteRepository.insertReadingAsync(sensorReading);
        mqttCluster.publishData(global.fireBaseReadingTopic, sensorReading);
        var zonesReadings = await sqliteRepository.getCurrentReadingsAsync();
        var request = { timestamp: Math.floor(new Date() / 1000), zoneReading: sensorReading };
        mqttCluster.publishData(global.zonesReadingsTopic, request);
        console.log("processed");
    }



}

exports.newInstance = function (zoneCode) {
    var instance = new Sensor(zoneCode);
    return instance;
}
