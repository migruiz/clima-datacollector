var mqtt = require('./mqttCluster.js');
var sqliteRepository = require('./sqliteSensorReadingRepository.js');
const RESOLUTIONMINS=5
const HOURSTOKEEP=12
class ZoneHistory {    
    constructor(zoneCode) {
      this.history={}
      this.zoneCode=zoneCode;
    }
    async initAsync() {
        var currentHistory=await sqliteRepository.getHistory(this.zoneCode);
        if (currentHistory){
            for (var index in currentHistory) {
                var record=currentHistory[index]
                record.temperatureSum=record.temperature;
                record.humiditySum=record.humidity;
                this.history[record.timestamp]=record
            } 
    }
        var mqttCluster=await mqtt.getClusterAsync();
        var self=this;
        mqttCluster.subscribeData("zoneClimateChange/"+this.zoneCode,self.processReading.bind(this));
    }

    async saveIntervalData(lastIntervalStartTime,data){
        console.log('saving history ' + JSON.stringify(data))
        await sqliteRepository.insertHistoryAsync(this.zoneCode,lastIntervalStartTime,data);
    }
    async removeOldHistory(){
        var keys=Object.keys(this.history)
        var now=Math.floor(Date.now() / 1000);
        var keepTimeStamp=now - 60 * 60 * HOURSTOKEEP
        var keysToDelete=keys.filter(k=>k<=keepTimeStamp)
        for (var key in keysToDelete) {
            delete this.history[key]
        } 
        await sqliteRepository.deleteHistoryAsync(this.zoneCode,keepTimeStamp);      
        console.log('historylength@ '+ Object.keys(this.history).length);
        
    }
    async processReading(reading){
        console.log(JSON.stringify(reading))
        var resolutionSecs=RESOLUTIONMINS * 60
        var nearestStamp = Math.floor(reading.timeStamp / resolutionSecs) * resolutionSecs;
        var data=this.history[nearestStamp];
        if (!data){
            var keys=Object.keys(this.history)
            var lastIntervalStartTime=Math.max.apply(null,keys);
            if (lastIntervalStartTime!=-Infinity){
                var lastInterval=this.history[lastIntervalStartTime]
                delete lastInterval.temperatureSum;
                delete lastInterval.humiditySum;
                await this.saveIntervalData(lastIntervalStartTime,lastInterval)
                await this.removeOldHistory()
            }
            this.history[nearestStamp]={
                readings:0,
                temperatureSum:0,
                humiditySum:0
            }     
        }
        data=this.history[nearestStamp];
        data.readings=data.readings+1   
        data.temperatureSum=data.temperatureSum + reading.temperature 
        data.humiditySum=data.humiditySum + reading.humidity
        data.temperature= Math.round( data.temperatureSum/data.readings * 1e1 ) / 1e1 
        data.humidity= Math.round( data.humiditySum/data.readings * 1e1 ) / 1e1 
        console.log(this.zoneCode + ' ' + nearestStamp + '    ' + data.readings + ' ' +  data.temperature);
    }
}
module.exports = ZoneHistory;
 