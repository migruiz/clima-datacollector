var mqtt = require('./mqttCluster.js');
var fileReadingExtractor = require('./fileReadingExtractor.js');
//var firebaseDb = require('./db-firebase.js');
var sensorsCreator = require('./sensor.js');

global.zones= {
    masterroom: { sensorId: 'BC', boilerZone: 'upstairs', FBProject: 'https://master-bedr.firebaseio.com/' },
    playroom: { sensorId: 'C1', boilerZone: 'upstairs', FBProject: '"https://entrance-a09f3.firebaseio.com/"' },
    secondbedroom: { sensorId: 'C6', boilerZone: 'upstairs', FBProject: 'https://secondbedroom-99372.firebaseio.com/' },
    computerroom: { sensorId: 'CC', boilerZone: 'upstairs', FBProject: 'https://computer-room.firebaseio.com/' },
    outside: { sensorId: 'CD', FBProject: 'https://outside-9a247.firebaseio.com/' },
    masterbathroom: { sensorId: 'E0', boilerZone: 'upstairs', FBProject: 'https://masterbathroom-99bfb.firebaseio.com/' },
    livingroom: { sensorId: 'E9', boilerZone: 'downstairs', FBProject: 'https://livingroom-da3de.firebaseio.com/' },
}
global.dbPath = 'c:\\temp.sqlite';
//global.mtqqLocalPath = process.env.MQTTLOCAL;
global.mtqqLocalPath = "mqtt://localhost";
global.sensorReadingTopic = 'sensorReading';
global.fireBaseReadingTopic = 'firebaseNewReading';
global.zonesReadingsTopic = 'zonesChange';


var sensorsMap = new Map();
for (var key in global.zones) {
    sensorsMap.set(global.zones[key].sensorId, { zoneCode: key, sensor: sensorsCreator.newInstance() });
}
console.log(JSON.stringify(sensorsMap));


mqtt.cluster().subscribeData(global.sensorReadingTopic, onOregonContentReceived);
//mqttCluster.subscribeData(global.fireBaseReadingTopic, firebaseDb.updateFirebaseAsync);
console.log('listenging now');
function onOregonContentReceived(content) {
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
    console.log(sensorReading);
    sensorData.sensor.processNewReading(sensorReading, rpId);
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






