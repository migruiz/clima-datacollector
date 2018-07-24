var sqlite = require('./db-sqlite.js');

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


var singleton;

exports.instance = function () {

    if (!singleton) {
        singleton = new sqlite.SQLDB(global.dbPath, versionHistory);
    }

    return singleton;
}