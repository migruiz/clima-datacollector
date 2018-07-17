var amqp = require('amqplib');
var fileReadingExtractor = require('./fileReadingExtractor.js');
var firebaseSyncReceiver = require('./firebaseSyncReceiver.js');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var oregonSensorReceiver = require('./oregonSensorReceiver.js');
var sensorsCreator = require('./sensor.js');

global.map = {
    BC: "masterroom",
    C1: "entrance",
    C6: "secondbedroom",
    CC: "computerroom",
    CD: "outside",
    E0: "masterbathroom",
    E9: "livingroom"
};

var sensors = {
    masterroom: sensorsCreator.newInstance("masterroom"),
    entrance: sensorsCreator.newInstance("entrance"),
    secondbedroom: sensorsCreator.newInstance("secondbedroom"),
    computerroom: sensorsCreator.newInstance("computerroom"),
    outside: sensorsCreator.newInstance("outside"),
    masterbathroom: sensorsCreator.newInstance("masterbathroom"),
    livingroom: sensorsCreator.newInstance("livingroom")
};


firebaseSyncReceiver.startMonitoring('amqp://pi:pi@localhost');

oregonSensorReceiver.startMonitoring('amqp://pi:pi@localhost', onOregonContentReceivedAsync);
console.log('listenging now');
function onOregonContentReceivedAsync(content) {
    var sensorReading = fileReadingExtractor.extractReading(content.fileName, content.data);
    if (!sensorReading)
        return;
    var rpId = content.piId;
    sensorReading.zoneCode = global.map[sensorReading.sensorId];   
    if (!sensorReading.zoneCode) {
        console.log("cound find: " + sensorReading.zoneCode);
        return;
    }
    var sensor = sensors[sensorReading.zoneCode];
    sensor.processNewReadingAsync(sensorReading, rpId);
}








// Catch uncaught exception
process.on('uncaughtException', err => {
    console.dir(err, { depth: null });
    process.exit(1);
});
process.on('exit', code => {
    console.log('Process exit');
    process.exit(code);
});
process.on('SIGTERM', code => {
    console.log('Process SIGTERM');
    process.exit(code);
});






