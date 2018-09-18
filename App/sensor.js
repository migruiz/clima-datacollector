var mqtt = require('./mqttCluster.js');
var sqliteRepository = require('./sqliteSensorReadingRepository.js');

function Sensor() {

    var lastReading;
    var waitingForOtherSensors;
    var coverageText="00000";
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
        
        var newcoverageText=coverageText+sensorReading.rpi.toString();
        newcoverageText = newcoverageText.substring(newcoverageText.length - 5, newcoverageText.length);
        coverageText=newcoverageText;
        sensorReading.coverage=coverageText;
        
        waitingForOtherSensors=false;
        await sqliteRepository.insertReadingAsync(sensorReading);
        mqtt.cluster().publishData(global.fireBaseReadingTopic, sensorReading);
        var zonesReadings = await sqliteRepository.getCurrentReadingsAsync();
        var request = { timestamp: Math.floor(new Date() / 1000), zoneReading: sensorReading };
        mqtt.cluster().publishData(global.zonesReadingsTopic, request);
    }



}

exports.newInstance = function () {
    var instance = new Sensor();
    return instance;
}
