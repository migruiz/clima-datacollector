var mqttCluster = require('./mqttCluster.js').cluster();


exports.startMonitoring =function (onOregonContentReceivedAsync) {

    mqttCluster.subscribe('sensorReading', message => {
        var oregonContent = JSON.parse(message);
        onOregonContentReceivedAsync(oregonContent);
    });

}