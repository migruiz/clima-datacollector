var mqtt = require('./mqttCluster.js');
var fileReadingExtractor = require('./fileReadingExtractor.js');
var sensorsCreator = require('./sensor.js');
const ZoneHistory = require('./ZoneHistory.js');

global.zones= {
    masterroom: { sensorId: 'CC', boilerZone: 'upstairs' },    
    livingroom: { sensorId: 'E9', boilerZone: 'downstairs'},
    entrance: { sensorId: 'C1', boilerZone: 'downstairs' },  
    masterbathroom: { sensorId: 'E0', boilerZone: 'upstairs' }, 
    computerroom: { sensorId: 'C6', boilerZone: 'upstairs'},
    secondbedroom: { sensorId: 'F1', boilerZone: 'upstairs' },
    outside: { sensorId: 'CD' },
}
//global.dbPath = 'c:\\temp.sqlite';
global.dbPath = '/ClimaCollectorApp/DB/db.sqlite'

global.mtqqLocalPath = process.env.MQTTLOCAL;
//global.mtqqLocalPath = "mqtt://piscos.tk";
global.sensorReadingTopic = 'sensorReading';


var sensorsMap = new Map();
for (var key in global.zones) {
    var sensor=sensorsCreator.newInstance(key);
    sensorsMap.set(global.zones[key].sensorId,sensor );
    global.zones[key].sensor=sensor;
    global.zones[key].history=new ZoneHistory(key);
}

(async function(){
    var mqttCluster=await mqtt.getClusterAsync() 
    mqttCluster.subscribeData(global.sensorReadingTopic, onOregonContentReceivedAsync);
    mqttCluster.subscribeData("AllZonesReadingsRequest", OnAllZonesReadingsRequest);


    for (var key in global.zones) {
        var zoneHistory=global.zones[key].history
        await zoneHistory.initAsync();        
    }

    console.log('listenging now');
  })();



async function OnAllZonesReadingsRequest(content) {
    var zones=[];
    for (var key in global.zones) {
        var zoneSensor=global.zones[key].sensor
        var zoneReading=zoneSensor.getLastReading();
        zones.push(zoneReading)
    }
    var mqttCluster=await mqtt.getClusterAsync() 
    mqttCluster.publishData("AllZonesReadingResponse",zones)
}


async function onOregonContentReceivedAsync(content) {
    var sensorReading = fileReadingExtractor.extractReading(content.fileName, content.data);
    if (!sensorReading)
        return;
    var rpId = content.piId;
    sensorData = sensorsMap.get(sensorReading.sensorId);
    if (!sensorData) {
        return;
    }
    await sensorData.processNewReadingAsync(sensorReading, rpId);
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






