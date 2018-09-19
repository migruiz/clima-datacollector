var mqtt = require('./mqttCluster.js');
var sqliteRepository = require('./sqliteSensorReadingRepository.js');
var PromiseQueue = require('a-promise-queue');
function Sensor(zoneCode) {

    
    var lastReading={
        coverage:"000000",
        zoneCode:zoneCode
    }
    startNotReceivedTransmissionCountDown();

    var notTransmittingHandler;
    var messageReadingQueue = new PromiseQueue();
    var waitingForOtherSensors;
    this.getLastReading=function(){
        return lastReading;
    }
    this.processNewReadingAsync = async function (sensorReading, piId) {
        clearInterval(notTransmittingHandler);
        startNotReceivedTransmissionCountDown();
        //console.log((new Date().getTime())+' '+sensorReading.sensorId+' '+piId.toString());
        return await messageReadingQueue.add(async function () {
            if (waitingForOtherSensors) {
                lastReading.rpi = lastReading.rpi | piId;
            }
            else {
                lastReading.channel=sensorReading.channel;
                lastReading.humidity=sensorReading.humidity;
                lastReading.sensorId=sensorReading.sensorId;
                lastReading.temperature=sensorReading.temperature;
                lastReading.timeStamp=sensorReading.timeStamp;
                lastReading.rpi = piId;
                waitingForOtherSensors = true;
                setTimeout(() => 
                {                    
                    waitingForOtherSensors = false;
                    onAllSensorsReadAsync();
                }, 1000 * 2);
            }
        });
    }

    function startNotReceivedTransmissionCountDown(){
        notTransmittingHandler = setInterval(function () {
            updateSensorCoverage('0');
            mqtt.cluster().publishData(global.fireBaseReadingTopic, lastReading);
        }, 1000 * 60);
    }

    function updateSensorCoverage(symbol){
        var newcoverageText = lastReading.coverage + symbol;
        newcoverageText = newcoverageText.substring(newcoverageText.length - 6, newcoverageText.length);
        lastReading.coverage = newcoverageText;
    }
    async function onAllSensorsReadAsync() {
        updateSensorCoverage(lastReading.rpi.toString());
        await sqliteRepository.insertReadingAsync(lastReading);
        mqtt.cluster().publishData(global.fireBaseReadingTopic, lastReading);
        mqtt.cluster().publishData(global.zonesReadingsTopic, lastReading);
    }



}

exports.newInstance = function (zoneCode) {
    var instance = new Sensor(zoneCode);
    return instance;
}
