var queueListener = require('./rabbitQueueListenerConnector.js')
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var firebaseDb = require('./db-firebase.js');



exports.startMonitoring = function (intranetAMQPURI) {
    queueListener.listenToQueue(intranetAMQPURI, 'firebaseZoneReadingSyncQueue', { durable: true, noAck: false }, function (ch, msg) {
        ;
        var content = msg.content.toString();
        var sensorReading = JSON.parse(content);
        var asyncFx = async(function () {
            try {
                await(firebaseDb.updateFirebaseAsync(sensorReading));
                ch.ack(msg);
            }
            catch (err) {
                console.log(err);
                setTimeout(function () {
                    ch.reject(msg, true);
                }, 1000);
            }
        })
        asyncFx();
    });
}