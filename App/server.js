//var mqtt = require('mqtt')
//var client = mqtt.connect('mqtt://test.mosquitto.org')

//client.on('connect', function (connack) {
//    client.subscribe('test')
//    console.log('connected');
//    console.log(connack);
//})

//client.on('message', function (topic, message) {
//    console.log(message.toString())
//})
//client.on('reconnect', function () {
//    console.log('reconnect');
//})
//client.on('close', function () {
//    console.log('close');
//})
//client.on('offline', function () {
//    console.log('offline');
//})
//client.on('error', function (error) {
//    console.log('error');
//    console.log(error);
//})
//client.on('end', function () {
//    console.log('end');
//})
//client.on('packetsend', function (packetsend) {
//    console.log('packetsend');
//    console.log(packetsend);
//})
//client.on('packetreceive', function (packetreceive) {
//    console.log('packetreceive');
//    console.log(packetreceive);
//})

//return;
var fileReadingExtractor = require('./fileReadingExtractor.js');
//var firebaseSyncReceiver = require('./firebaseSyncReceiver.js');
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


//firebaseSyncReceiver.startMonitoring(process.env.TEMPQUEUEURL);

oregonSensorReceiver.startMonitoring('mqtt://localhost', onOregonContentReceived);
console.log('listenging now');
function onOregonContentReceived(content) {
    var sensorReading = fileReadingExtractor.extractReading(content.fileName, content.data);
    if (!sensorReading)
        return;
    var rpId = content.piId;
    sensorReading.zoneCode = global.map[sensorReading.sensorId];   
    if (!sensorReading.zoneCode) {
        console.log("cound find: " + sensorReading.zoneCode);
        return;
    }
    console.log(sensorReading);
    var sensor = sensors[sensorReading.zoneCode];
    sensor.processNewReading(sensorReading, rpId);
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






