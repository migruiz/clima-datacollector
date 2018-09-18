exports.extractReading = (fn,fc) => {
    //'OSV2 1A2D10CD1209900645ED,1,9.100000,69.000000'
    var timeStamp = Math.round(parseInt(fn) / 1000);
    var trimmedMessage = fc.replace(/ /g, '');
    var sensorId = trimmedMessage.substring(10, 12);
    var partsOfStr = trimmedMessage.split(',');
    var sensorReading = {
        timeStamp: timeStamp,
        message: partsOfStr[0],
        sensorId: sensorId,
        channel: parseInt(partsOfStr[1]),
        temperature: parseFloat(partsOfStr[2]),
        humidity: parseFloat(partsOfStr[3])
    };

    //error try to recover
    if (sensorReading.channel < 1 || sensorReading.channel > 3) {

        return null;
    }
    return sensorReading;
}


//    OSV2 1A2D1002 502060552A4C
//    The first step is to reverse order of quartet in each byte to get :

//    OSV2 A 1D20 1 20 0 502 0 655 2A 4C
//    Last 4 bytes are not swapped.Here is the interpretation of these data:

//    OSV2 � is a string added by decoder to identify the protocol
//    A � is a sync quartet, it is not to be considered a data
//    1D20 � is the Oregon device ID (here THGR122NX)
//    1 � is the channel, values are 1, 2, 4 for channel 1, 2, 3
//    20 � is a rolling and random value changed after each reset
//    0 � is battery flag, battery is low when flag have bit 2 set (&4)
//    502 � is reversed BCD temperature value (here 20.5�C)
//    0 � is temperature sign, here �+�
//    655 � is reversed BCD humidity value (here 55.6%)
//    2A � is a quartet checksum starting at deviceID
//    4C � is the crc value starting at deviceID
function getReadingFromDataMessage(originalMessage) {
    var dataMessage = originalMessage.substring(4, 24);
    var reversedMessage = '';
    for (i = 0; i < 10; i++) {
        var quartet = dataMessage.substring(2 * i, 2 * i + 2);
        reversedMessage = reversedMessage + reverseString(quartet);

    }
    var oregonModel = reversedMessage.substring(1, 5);
    var channel = parseInt(reversedMessage.substring(5, 6));
    channel = decodeChannel(channel);
    var sensorId = reverseString(reversedMessage.substring(6, 8));
    var temperatureText = reverseString(reversedMessage.substring(9, 12));
    var temperatureAbs = parseFloat(temperatureText.substring(0, 1)) * 10
        + parseFloat(temperatureText.substring(1, 2)) * 1
        + parseFloat(temperatureText.substring(2, 3)) * 0.1;
    var sign = reversedMessage.substring(12, 13) === '0' ? 1 : -1;
    var temperature = sign * temperatureAbs;
    var humidityText = reverseString(reversedMessage.substring(13, 15));
    var humidity = parseFloat(humidityText);

    var readingIsValid = isReadingValid(channel, temperature, humidity);
    if (!readingIsValid)
        return null;
    var sensorReading = {
        message: originalMessage,
        sensorId: sensorId,
        channel: channel,
        temperature: temperature,
        humidity: humidity
    };
    return sensorReading;
}

function decodeChannel(channel) {
    if (channel == 1)
        return 1;
    if (channel == 2)
        return 2;
    if (channel == 4)
        return 3;
    return -1;
}

function isReadingValid(channel, temperature, humidity) {
    if (isNaN(channel))
        return false;
    if (isNaN(temperature))
        return false;
    if (isNaN(humidity))
        return false;
    var validChannel = channel == 1 || channel == 2 || channel == 3;
    if (!validChannel)
        return false;
    if (temperature < -10)
        return false;
    if (temperature > 40)
        return false;
    if (humidity < 20)
        return false;
    if (humidity > 95)
        return false;
    return true;
}

function reverseString(str) {
    // Step 1. Use the split() method to return a new array
    var splitString = str.split(""); // var splitString = "hello".split("");
    // ["h", "e", "l", "l", "o"]

    // Step 2. Use the reverse() method to reverse the new created array
    var reverseArray = splitString.reverse(); // var reverseArray = ["h", "e", "l", "l", "o"].reverse();
    // ["o", "l", "l", "e", "h"]

    // Step 3. Use the join() method to join all elements of the array into a string
    var joinArray = reverseArray.join(""); // var joinArray = ["o", "l", "l", "e", "h"].join("");
    // "olleh"

    //Step 4. Return the reversed string
    return joinArray; // "olleh"
}