
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
            setTimeout(() => await reportReadingAfterWaitingForSensorsAsync(lastReading), 1000 * 5);
        }
    }
    async function reportReadingAfterWaitingForSensorsAsync(sensorReading) {
        await sqliteRepository.insertReadingAsync(sensorReading);
        //sendChangeToFirebasSync(process.env.TEMPQUEUEURL, sensorReading);
        //var zonesReadings = await (sqliteRepository.getCurrentReadingsAsync());
        //var request = { timestamp: Math.floor(new Date() / 1000), zoneReading: sensorReading };
        //reportCurrentZoneReading(process.env.TEMPQUEUEURL, request);
    }



}

exports.newInstance = function (zoneCode) {
    var instance = new Sensor(zoneCode);
    return instance;
}
