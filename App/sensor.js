var await = require('asyncawait/await');
var async = require('asyncawait/async');
var locks = require('locks');
var amqp = require('amqplib');
var sqliteRepository = require('./sqliteSensorReadingRepository.js');

function Sensor(sensorCode) {

    var lastReading;
    var waitingForOtherSensorsMutex = locks.createMutex();
    this.processNewReadingAsync = function (sensorReading, piId) {
        await(safeProcessNewReading(sensorReading, piId));
    }
    var waitingForOtherSensors;
    function processNewReadingAsync(sensorReading, piId) {
        if (waitingForOtherSensors) {
            //check stamps maybe it was in the queue.
            lastReading.rpi = lastReading.rpi | piId;
        }
        else {
            sensorReading.rpi = piId;
            lastReading = sensorReading;
            waitingForOtherSensors = true;
            setTimeout(function () {                
                var asyncFx = async(function () {
                    await(reportReadingAfterWaitingForSensorsAsync(lastReading));
                });
                asyncFx();
            }, 1000 * 5);
        }
    }
    function reportReadingAfterWaitingForSensorsAsync(sensorReading) {
        return new Promise(function (resolve, reject) {

            waitingForOtherSensorsMutex.lock(function () {
                try {
                    waitingForOtherSensors = false;
                    await(reportReadingAsync(sensorReading));
                    resolve();
                }
                catch (err) {
                    return reject(err);
                }
                finally {
                    waitingForOtherSensorsMutex.unlock();
                }
            });
        });
    }
    function reportReadingAsync(sensorReading) {
        await(sqliteRepository.insertReadingAsync(sensorReading));
        sendChangeToFirebasSync(process.env.TEMPQUEUEURL, sensorReading);
        var zonesReadings = await(sqliteRepository.getCurrentReadingsAsync());
        var request = { timestamp: Math.floor(new Date() / 1000), zoneReading: sensorReading };
        reportCurrentZoneReading(process.env.TEMPQUEUEURL, request);
    }

    function safeProcessNewReading(sensorReading,piId) {
        return new Promise(function (resolve, reject) {

            waitingForOtherSensorsMutex.lock(function () {
                try {
                    await(processNewReadingAsync(sensorReading, piId));
                    resolve();
                }
                catch (err) {
                    return reject(err);
                }
                finally {
                    waitingForOtherSensorsMutex.unlock();
                }
            });
        });
    }

    function reportCurrentZoneReading(intranetAMQPURI, request) {
        amqp.connect(intranetAMQPURI).then(function (conn) {
            return conn.createChannel().then(function (ch) {
                var q = 'zoneReadingUpdate';
                var msg = JSON.stringify(request);

                var ok = ch.assertQueue(q, { durable: false });

                return ok.then(function (_qok) {
                    ch.sendToQueue(q, Buffer.from(msg));
                    return ch.close();
                });
            }).finally(function () { conn.close(); });
        }).catch(console.warn);
    }

    function sendChangeToFirebasSync(intranetAMQPURI, sensorReading) {
        amqp.connect(intranetAMQPURI).then(function (conn) {
            return conn.createChannel().then(function (ch) {
                var q = 'firebaseZoneReadingSyncQueue';
                var msg = JSON.stringify(sensorReading);

                var ok = ch.assertQueue(q, { durable: true });

                return ok.then(function (_qok) {
                    ch.sendToQueue(q, Buffer.from(msg));
                    return ch.close();
                });
            }).finally(function () { conn.close(); });
        }).catch(console.warn);
    }


}

exports.newInstance = function (zoneCode) {
    var instance = new Sensor(zoneCode);
    return instance;
}
