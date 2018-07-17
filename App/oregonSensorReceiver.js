var queueListener = require('./rabbitQueueListenerConnector.js')
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var firebaseDb = require('./db-firebase.js');



exports.startMonitoring = function (intranetAMQPURI, onOregonContentReceivedAsync) {
    queueListener.listenToQueue(intranetAMQPURI, 'zoneOregonReadingUpdateV2', { durable: true, noAck: false }, function (ch, msg) {

        var content = msg.content.toString();
        var oregonContent = JSON.parse(content);
        var asyncFx = async(function () {
            try {
                await(onOregonContentReceivedAsync(oregonContent));
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