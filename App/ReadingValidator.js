exports.validateReading = (reading, previousValidReading) => {

    if (reading.channel != previousValidReading.channel)
        return false;

    var temperatureMaxFactor = 2 / (4 * 60);
    var humidityMaxFactor = 20 / (4 * 60);

    var deltaTime = reading.timeStamp - previousValidReading.timeStamp;

    var maxExpectedTemperature = previousValidReading.temperature + temperatureMaxFactor * deltaTime;
    var minExpectedTemperature = previousValidReading.temperature - temperatureMaxFactor * deltaTime;
    var validTemperatureRange = minExpectedTemperature < reading.temperature && reading.temperature < maxExpectedTemperature;
    if (!validTemperatureRange)
        return false;

    var maxExpectedHumidity = previousValidReading.humidity + humidityMaxFactor * deltaTime;
    var minExpectedHumidity = previousValidReading.humidity - humidityMaxFactor * deltaTime;
    var validHumidityRange = minExpectedHumidity < reading.humidity && reading.humidity < maxExpectedHumidity;
    if (!validHumidityRange)
        return false;
}

