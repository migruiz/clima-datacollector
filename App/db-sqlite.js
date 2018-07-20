var test = 3;

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


var fx = function () {
    var instance;

    function createInstance() {

        var sqlite3 = require('sqlite3').verbose();
        var db = new sqlite3.Database('C:\\repos\\clima-datacollector\\App\\test.sqlite');
        return db;
    }
    db = createInstance();
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


    async function  applyDatabaseConfigurationChangesAsync(db, currentVersion, versions) {
        for (var i = currentVersion; i < versions.length; i++) {
            var expr = versions[i];
            await db.runAsync(expr);
        }
    }

    var suspendable = async function () {
        var data = await db.getAsync("PRAGMA USER_VERSION");
            var currentVersionNo = data.user_version;
            var newVersionNo = versionHistory.length;
            if (newVersionNo > currentVersionNo) {
                await db.runAsync("BEGIN IMMEDIATE TRANSACTION");
                try {
                    await applyDatabaseConfigurationChangesAsync(db, currentVersionNo, versionHistory);
                    await db.runAsync("PRAGMA USER_VERSION=" + newVersionNo.toString());
                    await db.runAsync("COMMIT TRANSACTION");
                }
                catch (err) {
                    await db.runAsync("ROLLBACK");
                    throw err;
                }

            }
        
        
    }
    suspendable();






};
var singleton = fx();


exports.database = function () {

    return singleton;
}

