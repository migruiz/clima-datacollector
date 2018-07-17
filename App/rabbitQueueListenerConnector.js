var amqp = require('amqplib');
var await = require('asyncawait/await');
var async = require('asyncawait/async');

function listenToQueue(serverURI, queuename, config, onMessageReceived) {
    function reportError() {
        console.log(Math.floor(new Date() / 1000));
    }
    function monitorConnection(connection) {
        var onProcessTerminatedHandler = function () { connection.close(); };
        connection.on('error', function (err) {
            console.log("on error queue" + serverURI + queuename);
            console.log(err);
            reportError();
            setTimeout(function () {
                listenToQueue(serverURI, queuename, config, onMessageReceived);
            }, 1000);
        });
        process.once('SIGINT', onProcessTerminatedHandler);
    }
    var asyncFx = async(function () {
        try {
            var connection = await(amqp.connect(serverURI));
        }
        catch (connerr) {
            console.log("error connecting queue" + serverURI + queuename);
            reportError();
            setTimeout(function () {
                listenToQueue(serverURI, queuename, config, onMessageReceived);
            }, 1000);
            return;
        }
        monitorConnection(connection);
        var channel = await(connection.createChannel());
        await(channel.assertQueue(queuename, { durable: config.durable }));
        channel.consume(queuename, function (msg) {            
            try {
                onMessageReceived(channel, msg);
            } catch (err) {
                console.log("err consuming message" + serverURI + queuename);
                console.log(msg);
            }
        }, { noAck: config.noAck });

    });
    asyncFx();

}
exports.listenToQueue = listenToQueue;
