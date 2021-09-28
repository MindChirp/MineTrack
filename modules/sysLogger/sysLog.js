//This file will aid in creating system log files in the appdata folder, for debugging
const fs = require("fs-extra");
const { notification } = require("../../main");
const path = require("path");
async function debugSys(log) {
    console.log("oisdoifoisd")
    var log = log + '';
    var obj = {
        meta: {
            timeStamp: new Date(),
        },
        body: log
    }

    try {
        await fs.access(path.join(filesPath, "sysLogs"))
    } catch (error) {
        try {
            fs.mkdir(path.join(filesPath, "sysLogs"));
        } catch (error) {
            console.error(error);
            notification("Could not create log");
        }
    }

    try {
        var fileName = createFileName();
        console.log(userConfig);
        if(userConfig.notifyLogging) {
            notification("Saving log " + fileName)
        }
        await fs.writeFile(path.join(filesPath, "sysLogs", fileName + ".json"), JSON.stringify(obj, null, 4));
    } catch (error) {
        console.error(error);
        notification("Could not create log");
    }
}

module.exports = { debugSys };