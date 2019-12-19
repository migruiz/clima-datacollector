var mqtt = require('./mqttCluster.js');
var fileReadingExtractor = require('./fileReadingExtractor.js');
var sensorsCreator = require('./sensor.js');
const ZoneHistory = require('./ZoneHistory.js');

global.zones= {
    computerrom: { sensorId: '6A', boilerZone: 'upstairs', order:31 },    //computerrom
    ensuite: { sensorId: 'FA', boilerZone: 'downstairs', order: 20},  //ensuite
    kitchen: { sensorId: '79', boilerZone: 'downstairs', order: 11 },  //kitchen
    livingroom: { sensorId: 'E0', boilerZone: 'upstairs', order:10 }, //livingroom
    masterroom: { sensorId: 'F6', boilerZone: 'upstairs', order: 30},  //masterroom
    playroom: { sensorId: 'BD', boilerZone: 'upstairs', order: 21 },  //playroom
    outside: { sensorId: 'CD', order: 1 },
}
//global.dbPath = 'c:\\temp.sqlite';
global.dbPath = '/ClimaCollectorApp/DB/db.sqlite'

global.mtqqLocalPath = process.env.MQTTLOCAL;
//global.mtqqLocalPath = "mqtt://piscos.tk";
global.sensorReadingTopic = 'sensorReading';
global.rflinkOregonTopic = 'Oregon TempHygro'


var sensorsMap = new Map();
for (var key in global.zones) {
    var sensor=sensorsCreator.newInstance(key,global.zones[key].order);
    sensorsMap.set(global.zones[key].sensorId,sensor );
    global.zones[key].sensor=sensor;
    global.zones[key].history=new ZoneHistory(key);
}

(async function(){
    var mqttCluster=await mqtt.getClusterAsync() 
    mqttCluster.subscribeData(global.sensorReadingTopic, onOregonContentReceivedAsync);
    mqttCluster.subscribeData(global.rflinkOregonTopic, onOregonRFLINKContentReceivedAsync);
    mqttCluster.subscribeData("AllZonesReadingsRequest", OnAllZonesReadingsRequest);
    mqttCluster.subscribeData("AllZonesTemperatureHistoryRequest", OnAllZonesTemperatureHistoryRequest);


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
async function OnAllZonesTemperatureHistoryRequest(content) {
    var zonesHistory=[];
    for (var key in global.zones) {
        var history=global.zones[key].history
        var historyEntries=history.getTemperatureHistoryList();
        zonesHistory.push({zoneCode:key,order:global.zones[key].order ,history:historyEntries})
    }
    var mqttCluster=await mqtt.getClusterAsync() 
    mqttCluster.publishData("AllZonesTemperatureHistoryResponse",zonesHistory)
}


async function onOregonContentReceivedAsync(content) {
    var sensorReading = fileReadingExtractor.extractReading(content.fileName, content.data);
    if (!sensorReading)
        return;
    var rpId = content.piId;
    const sensorData = sensorsMap.get(sensorReading.sensorId);
    if (!sensorData) {
        console.log("unknown sensor ID:"+sensorReading.sensorId+ " reading:"+JSON.stringify(sensorReading))
        return;
    }
    await sensorData.processNewReadingAsync(sensorReading, rpId);
}

async function onOregonRFLINKContentReceivedAsync(content) {
    const TEMPHEX = content.TEMP;
    const TEMPVALSTRING  = TEMPHEX.substring(1,4)
    const encodedValue = parseInt(TEMPVALSTRING, 16);

    var temperatureAbs = encodedValue * 0.1 ;
    var sign = TEMPHEX.substring(0, 1) === '0' ? 1 : -1;
    var temperature = sign * temperatureAbs;


    const sensorReading = {
        channel: 33,
        humidity: parseInt(content.HUM),
        temperature: temperature,
        sensorId: content.ID.substring(2,4),
        timeStamp: Math.round((new Date).getTime() / 1000 )
    };
    const sensorData = sensorsMap.get(sensorReading.sensorId);
    if (!sensorData) {
        console.log("unknown sensor ID:"+sensorReading.sensorId+ " reading:"+JSON.stringify(sensorReading))
        return;
    }

    await sensorData.processNewReadingAsync(sensorReading, 2);
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






