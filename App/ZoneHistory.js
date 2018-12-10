var mqtt = require('./mqttCluster.js');
class ZoneHistory {
    constructor(zoneCode) {
      this.history={}
      this.zoneCode=zoneCode;
    }
    async initAsync() {
        var mqttCluster=await mqtt.getClusterAsync();
        var self=this;
        mqttCluster.subscribeData("zoneClimateChange/"+this.zoneCode,async  function(reading) {
            console.log(reading)
        });
    }
}
module.exports = ZoneHistory;
 