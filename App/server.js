var mqtt = require('./mqttCluster.js');
var fileReadingExtractor = require('./fileReadingExtractor.js');
var firebaseDb = require('./db-firebase.js');
var sensorsCreator = require('./sensor.js');

global.zones= {
    masterroom: { sensorId: 'BC', boilerZone: 'upstairs' },
    playroom: { sensorId: 'C1', boilerZone: 'upstairs' },
    secondbedroom: { sensorId: 'C6', boilerZone: 'upstairs' },
    computerroom: { sensorId: 'CC', boilerZone: 'upstairs'},
    outside: { sensorId: 'CD' },
    masterbathroom: { sensorId: 'E0', boilerZone: 'upstairs' },
    livingroom: { sensorId: 'E9', boilerZone: 'downstairs'},
}
global.dbPath = 'c:\\temp.sqlite';
//global.dbPath = '/App/db.sqlite'

global.mtqqLocalPath = process.env.MQTTLOCAL;
//global.mtqqLocalPath = "mqtt://localhost";
global.sensorReadingTopic = 'sensorReading';
global.fireBaseReadingTopic = 'firebaseNewReading';
global.zonesReadingsTopic = 'zonesChange';


var sensorsMap = new Map();
for (var key in global.zones) {
    sensorsMap.set(global.zones[key].sensorId, { zoneCode: key, sensor: sensorsCreator.newInstance() });
}
console.log(JSON.stringify(sensorsMap));


mqtt.cluster().subscribeData(global.sensorReadingTopic, onOregonContentReceivedAsync);
mqtt.cluster().subscribeData(global.fireBaseReadingTopic, firebaseDb.updateFirebaseAsync);
console.log('listenging now');
async function onOregonContentReceivedAsync(content) {
    var sensorReading = fileReadingExtractor.extractReading(content.fileName, content.data);
    if (!sensorReading)
        return;
    var rpId = content.piId;
    sensorData = sensorsMap.get(sensorReading.sensorId);
    if (!sensorData) {
        console.log("cound find: " + sensorReading.sensorId);
        return;
    }
    sensorReading.zoneCode = sensorData.zoneCode;
    await sensorData.sensor.processNewReadingAsync(sensorReading, rpId);
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






