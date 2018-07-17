
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var locks = require('locks');

require('sqlite3').Database.prototype.getAsync = function (sql, params) {
    var dbinner = this;
    return new Promise(function (resolve, reject) {
        dbinner.get(sql, params, function (err, data) {
            if (err !== null) return reject(err);
            resolve(data);
        });
    });
};
require('sqlite3').Database.prototype.allAsync = function (sql, params) {
    var dbinner = this;
    return new Promise(function (resolve, reject) {
        dbinner.all(sql, params, function (err, data) {
            if (err !== null) return reject(err);
            resolve(data);
        });
    });
};
require('sqlite3').Database.prototype.runAsync = function (sql, params) {
    var dbinner = this;
    return new Promise(function (resolve, reject) {
        dbinner.run(sql, params, function (err) {
            if (err !== null) return reject(err);
            resolve();
        });
    });
};


var singleton = (function () {
    var instance;

    function createInstance() {

        var sqlite3 = require('sqlite3').verbose();
        var db = new sqlite3.Database('/NodeFileMonitor/test.sqlite');
        //var db = new sqlite3.Database('D:\\Documents\\valves.sqlite');
        var mutex = locks.createMutex();
        return { db: db, mutex: mutex };
    }
    instance = createInstance();
    var versionHistory = [];
    versionHistory.push(`CREATE TABLE ZonesTemperature (
        id integer primary key
        ,zoneCode text not null collate nocase
        ,sensorId text not null collate nocase
        ,channel int
        ,temperature real
        ,humidity real
        ,timestamp int
        );`);
    versionHistory.push('CREATE UNIQUE INDEX IX_ZonesTemperature ON ZonesTemperature (zoneCode ASC);');


    function applyDatabaseConfigurationChanges(db, currentVersion, versions) {
        for (var i = currentVersion; i < versions.length; i++) {
            var expr = versions[i];
            // console.log(expr);
            await(db.runAsync(expr));
        }
    }

    var suspendable = async(function () {
        var result = await(operateDatabaseAsync(function (db) {
            var data = await(db.getAsync("PRAGMA USER_VERSION"));
            var currentVersionNo = data.USER_VERSION;
            var newVersionNo = versionHistory.length;
            if (newVersionNo > currentVersionNo) {
                await(db.runAsync("BEGIN IMMEDIATE TRANSACTION"));
                try {
                    applyDatabaseConfigurationChanges(db, currentVersionNo, versionHistory);
                    await(db.runAsync("PRAGMA USER_VERSION=" + newVersionNo.toString()));
                    await(db.runAsync("COMMIT TRANSACTION"));
                }
                catch (err) {
                    await(db.runAsync("ROLLBACK"));
                    throw err;
                }

            }
        }));
        return result;
    });
    suspendable();



    function operateDatabaseAsync(OperationAsyncFx) {

        return new Promise(function (resolve, reject) {


            var db = instance.db;
            var mutex = instance.mutex;
            mutex.lock(function () {
                try {
                    var result = await(OperationAsyncFx(db));
                    resolve(result);
                }
                catch (err) {
                    return reject(err);
                }
                finally {
                    mutex.unlock();
                }
            });
        });


        return overallResult;
    }
    return {
        operateDatabaseAsync: operateDatabaseAsync
    };
})();




exports.database = function () {

    return singleton;
}

