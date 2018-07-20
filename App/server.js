var mqttCluster = require('./mqttCluster.js').cluster();
var fileReadingExtractor = require('./fileReadingExtractor.js');
var firebaseDb = require('./db-firebase.js');
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


mqttCluster.subscribeData('sensorReading', onOregonContentReceived);
mqttCluster.subscribeData('firebaseNewReading', firebaseDb.updateFirebase);
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






