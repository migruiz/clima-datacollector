var mqtt = require('mqtt')


exports.startMonitoring =function (mqttServer, onOregonContentReceivedAsync) {


    var client = mqtt.connect(mqttServer);
    client.on('connect', () => client.subscribe('sensorReading'));
    client.on('message', function (topic, message) {
        var oregonContent = JSON.parse(message);
        onOregonContentReceivedAsync(oregonContent);
    })
}