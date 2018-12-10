var mqtt = require('./mqttCluster.js');
const RESOLUTIONMINS=2
const HOURSTOKEEP=1
class ZoneHistory {    
    constructor(zoneCode) {
      this.history={}
      this.zoneCode=zoneCode;
    }
    async initAsync() {
        var mqttCluster=await mqtt.getClusterAsync();
        var self=this;
        mqttCluster.subscribeData("zoneClimateChange/"+this.zoneCode,self.processReading.bind(this));
    }

    saveIntervalData(data){
        console.log(JSON.stringify(data))
    }
    removeOldHistory(){
        var keys=Object.keys(this.history)
        var now=Math.floor(Date.now() / 1000);
        var keepTimeStamp=now - 60 * 60 * HOURSTOKEEP
        var keysToDelete=keys.filter(k=>k<=keepTimeStamp)
        for (var key in keysToDelete) {
            delete this.history[key]
        }        
        
    }
    processReading(reading){
        console.log(JSON.stringify(reading))
        var resolutionSecs=RESOLUTIONMINS * 60
        var nearestStamp = Math.floor(reading.timeStamp / resolutionSecs) * resolutionSecs;
        var data=this.history[nearestStamp];
        if (!data){
            var keys=Object.keys(this.history)
            var lastIntervalStartTime=Math.max.apply(null,keys);
            if (lastIntervalStartTime!=-Infinity){
                this.saveIntervalData(this.history[lastIntervalStartTime])
                this.removeOldHistory()
            }
            this.history[nearestStamp]={
                readingsCount:0,
                temperatureSum:0
            }     
        }
        data=this.history[nearestStamp];
        data.readingsCount=data.readingsCount+1   
        data.temperatureSum=data.temperatureSum + reading.temperature 
        data.temperatureAvg= Math.round( data.temperatureSum/data.readingsCount * 1e1 ) / 1e1 
        console.log(this.zoneCode + ' ' + nearestStamp + '    ' + data.readingsCount + ' ' +  data.temperatureAvg);
    }
}
module.exports = ZoneHistory;
 