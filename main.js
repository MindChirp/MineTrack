
const { ipcRenderer } = require("electron");
const path = require("path");
var allowchecking = true;
var fs = require("fs-extra");
var filesPath;
var appDataPath;
var minecraftOpen = false;
var totalSeconds = 0;
var sessionTime = 0;
var userConfig;
var timeConfig;

const {gzip, ungzip} = require("node-gzip");

ipcRenderer.on("files-path", (ev, data)=>{
    filesPath = data;
    localStorage.setItem("files-path", filesPath);
});

function gatherFilePath() {
    return new Promise((resolve, reject)=>{
        while(filesPath == undefined) {
            filesPath = localStorage.getItem("files-path");

            if(filesPath) {
                //Get the userConfig
                resolve();
            }
        }

    })
}

window.onload = async ()=>{
    gatherFilePath()
    .then(async()=>{
        appDataPath = path.dirname(filesPath);
        try {
            await fs.access(path.join(filesPath, "configs", "userdata"))
            await gatherWorldInformation();
        } catch (error) {
            console.log(error)
        }
    
        
        checkResources()
        .then(async ()=>{
            try {
                var dat = await fs.readFile(path.join(filesPath, "configs", "userdata.json"), "utf8")
                userConfig = JSON.parse(dat);
            } catch (error) {
                notification("Error loading user config");
                return;
            }      

            loadData();
            startCheckingForMinecraft();

            //When all this is done, Check if all the log files have been scanned
            checkLogFileStatus()
            .then((res)=>{
                if(res.notChecked) {
                    scanLogFiles();
                }
            })
            .catch((err)=>{
                console.log(err);
            })
        })
        .catch((error)=>{
            console.log(err);
        })
        
    
    })
    .catch((err)=>{
        console.log(err);
    })
    
    
   
}
totalPercentage = 0;

function setProgIndPos() {
    return new Promise((resolve)=>{
        var bar = document.querySelector("#progress-box > div > div");
        if(!(bar instanceof HTMLElement)) {reject()};
        bar.style.width = totalPercentage/100*100 + "%";
        resolve();
    })
}

async function scanLogFiles() {
    return new Promise(async (resolve, reject)=>{
        var totalSecs = 0;
        //Create progress box
        var box = document.createElement("div");
        box.id="progress-box";
        box.className ="smooth-shadow";
        document.body.appendChild(box);

        var text = document.createElement("p");
        text.innerText = "Scanning minecraft log files. This may take some time."
        box.appendChild(text);

        var bar = document.createElement("div");
        bar.className = "bar";
        box.appendChild(bar);

        var ind = document.createElement("div");
        ind.className = "indicator";
        bar.appendChild(ind);

        var progInterval = setInterval(()=>{
            setProgIndPos();
        }, 1000);

        //Read all the zip-files
        var files;
        try {
            files = await fs.readdir(path.join(userConfig.minecraftpath, "logs"))
        } catch (error) {
            reject(error);
        }

        //Go through each of these zip-files, open the text file, and get the start and end time stamp.
        totalPercentage = 0;
        var percentageStep = 100 / files.length; //Maybe handle the situation that there are none files?
        var x;
        for(x of files) {
            var dat;
            try {
                dat = await fs.readFile(path.join(userConfig.minecraftpath, "logs", x));
            } catch (error) {
                console.log(error)
            }

            var unzipped;
            try {
                unzipped = await ungzip(dat)
            } catch (error) {
                console.log(error)               
            }

            var time = await parseLogContents(unzipped.toString()) //Convert the buffer to a log, and then parse it
            totalPercentage = totalPercentage + percentageStep;
            totalSecs = totalSecs + time;
            //Handle the contents of the file
            updateTimeCounting(totalSeconds + totalSecs); //kinda cool to see the time increment as the program scans the log files, might keep it
            
        }
        console.log(totalSecs, totalSeconds)

        console.log(totalSecs);
        //The code is done scanning the log files
        clearInterval(progInterval);

        bar.style.animation = "none";
        box.style.animation = "slide-down-notification 300ms ease-in-out both 1s";

        userConfig.logsCalculated = true;

        try {
            var times = await fs.readFile(path.join(filesPath, "worlddata", "scannedplaytime.json"), "utf8");
            var dat = JSON.parse(times);

            dat.multiplayertime = totalSecs;

            //Save the new file
            await fs.writeFile(path.join(filesPath, "worlddata", "scannedplaytime.json"), JSON.stringify(dat));
            
        } catch (error) {
            notification("Could not complete the log scanning process.")
            reject();
        }

        fs.writeFile(path.join(filesPath, "configs", "userdata.json"), JSON.stringify(userConfig, null, 4))
        .then(()=>{
            //OK
            console.log(userConfig)
        })
        .catch((err)=>{
            notification("Something went wrong while looking through your logs. We will try again the next time you open the program.")
            reject();
        })
    })
}

async function checkLogFileStatus() {
    return new Promise(async (resolve, reject)=>{
        //Check the config
        if(!userConfig.logsCalculated) {
            resolve({notChecked: true});
        } else {
            resolve({notChecked: false})
        }

    })
}

function parseLogContents(log) {
    return new Promise((resolve, reject)=>{
        //Get the first line, and the last line

        //This is how it works: 
        /*
        Go through the string, have a range of 10 letters, and move over one letter at a time.
        Use regex to remove the numbers, and check if the resulting string is like this [::]
        */
        var timestamps = [];

        for(let i = 0; i < log.length; i++) {
            //Split the log
            var string = log.substring(i, i+8);
            var format = string.replace(/[0-9]/g,'');
            if(format == '::') {
                //A timestamp is found!
                timestamps.push(string);
            }
        }

        //Now that the timestamps have been found, calculate the time
        
        if(timestamps.length < 2) {resolve(0)}
        var first = timestamps[0];
        var last = timestamps[timestamps.length-1];

        var fA = first.split(":"); //fA -> firstArr
        var lA = last.split(":");

        var additionalDay = 0;
        if(parseInt(lA[0]) < parseInt(fA[0])) {
            additionalDay = 1;
        }

        var today = new Date();
        var d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), fA[0], fA[1], fA[2]);
        var d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate()+additionalDay, lA[0], lA[1], lA[2]);

        var ms = d2-d1;
        
        var secs = ms/(1000);
        resolve(secs);
        
        /*
            THIS CODE NEEDS SOME IMPROVING. IT NEEDS TO HANDLE THE EVENT OF A PLAYER PLAYING PAST MIDNIGHT. --KINDA FIXED
        */

    })
}

async function startCheckingForMinecraft() {
    if(allowchecking) {
        //notification("Checking for minecraft status. Please wait.")
        var res;
        try {
            res = await ipcRenderer.invoke("check-for-minecraft");
        } catch (error) {
            notification("Could not save session");
        }
        if(res == true) {
            minecraftOpen = true;
            //Update the status bar
            var ind = document.getElementById("indicator");
            if(!ind.classList.contains("online")) {
                ind.classList.add("online");
                ind.classList.remove("offline");
            }
        } else if(res == false) {
            if(minecraftOpen==true) {
                //Save the session data. Minecraft was just open, but has now been closed
                //Check again for minecraft
                var check = await ipcRenderer.invoke("check-for-minecraft");
                if(!check) {
                    try {
                        await saveSession()
                    } catch (error) {
                        notification("Could not save session");
                    }
                }
            }
            minecraftOpen = false;
            //Update the status bar
            var ind = document.getElementById("indicator");
            if(!ind.classList.contains("offline")) {
                ind.classList.add("offline");
                ind.classList.remove("online");
            }
        }
    }
    var delay = minecraftOpen?5000:2000;
    setTimeout(startCheckingForMinecraft, delay);
}


function notification(title) {
    var el = document.createElement("div");
    el.className = "notification smooth-shadow";

    var t = document.createElement("p");
    t.innerText = title;
    el.appendChild(t);

    document.body.appendChild(el);
    setTimeout(()=>{
        el.parentNode.removeChild(el);
    }, 5000)
}


async function loadData() {
    //Load the configs into the GUI
    
    var scanned = await fs.readFile(path.join(filesPath, "worlddata", "scannedplaytime.json"))
    
    timeConfig = JSON.parse(scanned);

    //convert values to a good format
    totalSeconds = timeConfig.singleplayertime;
    if(!isNaN(timeConfig.totalSessionTime)) {
        totalSeconds = totalSeconds + timeConfig.totalSessionTime;
    }

    if(!isNaN(timeConfig.multiplayertime)) {
        totalSeconds = totalSeconds + timeConfig.multiplayertime;
    }
    var formed = convertHMS(totalSeconds);

    var title = document.querySelector("#main-container > div.time-counter > div.total > p");

    title.innerHTML = formed[0] + " hours " + formed[1] + " minutes " + formed[2] + " seconds ";
}


var folders = [
    "configs",
    "worlddata",
    "recordeddata"
]
function createFolders() {
    return new Promise(async(resolve, reject)=>{
        var x;
        var i = 0;
        for (x of folders) {
            try {
                await fs.mkdir(path.join(filesPath, x))
                if(i==folders.length-1) {
                    resolve();
                }
                i++;
            } catch (error) {
                reject(error);
            }
        }
    })
}

function checkResources() {
    return new Promise((resolve, reject)=>{

        //Check if configs folder extists
        fs.access(path.join(filesPath, "configs"))
        .then(()=>{
            resolve();
        })
        .catch(async ()=>{
            //Does not exist, enter setup mode
            await enterFirstTimeUse();
            
            createFolders()
            .then(()=>{
                var data = {
                    minecraftpath: setupInfo.minecraftpath,
                    uuid: setupInfo.uuid,
                    username: setupInfo.username
                }
                fs.writeFile(path.join(filesPath, "configs", "userdata.json"), JSON.stringify(data, null, 4))
                .then(async ()=>{
                    //Gather world information as part of the setup process
                    await gatherWorldInformation();
                    resolve();
                })
                .catch((err)=>{
                    alert(err);
                    reject();
                })
            })
            .catch((err)=>{
                console.log(err);
                reject();
            })

        })
    })
}


function closeProgram() {
    ipcRenderer.send("close-program")
    .then(()=>{
        console.log("closing");
    })
    .catch((err)=>{
        console.log(err);
    })
}

function minimizeProgram() {
    ipcRenderer.send("minimize-program")
    .then(()=>{
        console.log("minimizing");
    })
    .catch((err)=>{
        console.log(err);
    })
}

var setupInfo = {
    minecraftpath: undefined,
    uuid: undefined,
    username: undefined
}

function enterFirstTimeUse() {
    return new Promise((resolve, reject)=>{

        var setupError = (text)=>{
            var p = document.createElement("p");
            p.innerText = text;
            modal.insertBefore(p, divProceed);
            p.className = "error-text";

            setTimeout(()=>{
                p.parentNode.removeChild(p);
            }, 2000)
        }

        var modal = document.createElement("div");
        modal.className = "first-time-setup";
        document.body.appendChild(modal);
        
        var title = document.createElement("h1");
        title.innerText = "Let's get started.";
        modal.appendChild(title);
        title.className = "title";
        
        var wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        modal.appendChild(wrapper);
        
        var divProceed = document.createElement("div");
        divProceed.className = "proceed-wrapper";
        var proceed = document.createElement("button");
        proceed.innerHTML = "proceed";
        proceed.className = "proceed smooth-shadow";
        divProceed.appendChild(proceed);
        modal.appendChild(divProceed);

        var progCounter = document.createElement("div");
        progCounter.className = "progress-counter";
        divProceed.appendChild(progCounter);
        progCounter.setPage = (page) => {
            //Get children
            var children = progCounter.getElementsByClassName("dot");
            //Deselct everyone
            var x;
            for(x of children) {
                x.classList.remove("selected");
            }
            
            children[page].classList.add("selected");
        }
        
        for(let x = 0; x < 5; x++) {
            var dot = document.createElement("div");
            dot.className = "dot";
            progCounter.appendChild(dot);
        }
        
        function step0() {
            progCounter.setPage(0);
            proceed.onclick = step1;
            title.innerText = "Welcome!";

            var t = document.createElement("p");
            t.className = "sub-title";
            t.innerText = "Quick introduction";
            wrapper.appendChild(t);

            var info = document.createElement("p");
            info.className ="sub-title policy";
            info.innerHTML = `
                Thank you for downloading the open source <strong>Minecraft Hour Counter</strong> by MindChirp. During these next few pages,
                you will be guided through the initial setup process. You will be asked about your minecraft directory path, minecraft username, UUID and terms agreement. It is important that you answer correctly on all of these questions.
                If you are in doubt of what to do, read the instruction text carefully.
            `
            wrapper.appendChild(info);

            calculateButtonPos();
        }

        step0();
        
        async function step1(){
            title.innerHTML = "Let's get started."
            await cleanUp();
            proceed.onclick = ()=>{
                //Save the path
                setupInfo.minecraftpath = pText.innerText;
                //Check if that path exists
                fs.access(pText.innerHTML)
                .then(()=>{
                    //OK
                    step2();
                })
                .catch((error)=>{
                    //Not ok
                    setupError("This path does not exist");
                })
            };
            progCounter.setPage(1);
            var t = document.createElement("p");
            t.className = "sub-title";
            t.innerText = "Check if this path leads to your minecraft installation folder";
            
            var div = document.createElement("div");
            div.style = `
                margin: auto;
                width: fit-content;
                border-radius: 0.25rem;
            `;
            var pathBox = document.createElement("div");
            pathBox.className = "path-output smooth-shadow";
            var pText = document.createElement("p");
            
            var pathString = path.join(appDataPath, ".minecraft");
            pText.innerText = pathString;
            pathBox.appendChild(pText);
            div.appendChild(pathBox);
            
            var button = document.createElement("button");
            div.appendChild(button);
            button.innerHTML = "Browse";
            button.className = "browse-directory smooth-shadow";
            
            button.onclick = openDirectoryModal;
            
            wrapper.appendChild(t);
            wrapper.appendChild(div);
            calculateButtonPos();
            
            
        }
        

        function cleanUp() {
            return new Promise((resolve)=>{
                wrapper.style.animation = "change-left-introduction 500ms ease-in-out";
                setTimeout(()=>{
                    wrapper.style.animation = "none";
                    wrapper.style.animation = "change-right-introduction 500ms ease-in-out both";
                    wrapper.innerHTML = "";
                    setTimeout(()=>{
                        resolve();
                    }, 100)
                }, 400)
            })
        }

        function calculateButtonPos() {
            //Get the wrapper height
            var wr = document.querySelector("body > div.first-time-setup > div.proceed-wrapper");
            //get the height of the wrapper element
            var cont = document.querySelector("body > div.first-time-setup > div.wrapper");
            var styles = window.getComputedStyle(cont);
            var h = styles.height;
            console.log(h)

            var margin = "5rem";
            wr.style.marginTop = "calc(" + h + " + " + margin + ")";
        }

        async function step2(){            
            progCounter.setPage(2);
            await cleanUp();
            
            var t = document.createElement("p");
            t.className = "sub-title";
            t.innerText = "To use this program, you must comply to the following";
            wrapper.appendChild(t);

            var policy = document.createElement("p");
            policy.className ="sub-title policy";
            policy.innerHTML = `This program is strictly intented for counting the total time spent playing minecraft, and any use outside of what is
            described in this body of text, is prohibited. The creator reserves his rights to disable any copy of the program if needed.<br>
            This program scans through your minecraft game files, and tallies up the total play time from all of your worlds. No data will at any point be sent to any servers. 
            The source code of this project can be found at github under the username MindChirp, as minecraft-counter.

            <br><br>
            By clicking <strong>proceed</strong>, you agree to these terms.`
            wrapper.appendChild(policy);

            proceed.onclick = step3;
            
            calculateButtonPos();
        }

        async function step3() {
            progCounter.setPage(3);
            await cleanUp();

            proceed.onclick = ()=>{
                //Get input values
                var name = usr.value;
                var id = uuid.value;

                if(name.trim().length == 0 || id.trim().length == 0) {
                    setupError("Both fields must have a value");
                } else {
                    setupInfo.uuid = id;
                    setupInfo.username = name;
                    step4();
                }

            };

            var t = document.createElement("p");
            t.className = "sub-title";
            t.innerText = "You're almost there!";
            wrapper.appendChild(t);

            var info = document.createElement("p");
            info.className = "sub-title policy";
            info.innerHTML = `For the program to differentiate you from other players, in the case that user data for multiple players have been stored in one world,
            you need to enter both your player UUID, and your full minecraft username. To find your UUID, you can use <a href='https://mcuuid.net/' target='_blank'>this</a> webpage.`;
            wrapper.appendChild(info);

            var usr = document.createElement("input");
            usr.type = "text";
            usr.spellcheck = false;
            usr.placeholder = "Minecraft username"
            usr.className = "smooth-shadow";

            var uuid = document.createElement("input");
            uuid.spellcheck = false;
            uuid.type = "text";
            uuid.placeholder = "UUID"
            uuid.className = "smooth-shadow";

            wrapper.appendChild(usr);
            wrapper.appendChild(uuid);
            calculateButtonPos();
        }

        async function step4() {
            progCounter.setPage(4);
            await cleanUp();

            var t = document.createElement("p");
            t.className = "sub-title";
            t.innerText = "Getting started";
            wrapper.appendChild(t);

            var info = document.createElement("p");
            info.className = "sub-title policy";
            info.innerHTML = `
                When getting an initial estimate of your playtime, the program will <strong>not</strong> include the playtime on your servers. 
                When the program detects that you are in-game, however, everything you do inside of minecraft will be recorded as active playtime, even if you are idle in the start menu.
                <br>
                It is important that you have the program running to record your playtime. 
                <br>
                It is also recommended to enable this program on startup. 
                <br>
                To go through this setup process again, press the reset button in the program window.
            `;
            wrapper.appendChild(info)

            proceed.innerText = "finish setup"

            proceed.onclick = ()=>{


                //Finish the setup
                resolve(); //Resolve the promise, so that the rest of the setup process can commence
                modal.style.animation = "none";
                modal.style.animation = "fade-out 200ms ease-in-out both";
                setTimeout(()=>{
                    modal.parentNode.removeChild(modal);
                }, 200)

            }

            calculateButtonPos();
        }
        
    })
}

async function openDirectoryModal() {
    var result = await ipcRenderer.invoke("open-directory-modal", "pp");
    if(result.trim().length < 1) return;
    var text = document.querySelector("body > div.first-time-setup > div.wrapper > div > div > p");
    if(text instanceof HTMLElement) {
        text.innerText = result;
    }

}


async function gatherWorldInformation() {
    return new Promise(async (resolve, reject)=>{
        
        //Read the config
        var dat = await fs.readFile(path.join(filesPath, "configs", "userdata.json"), "utf8");
        var config = JSON.parse(dat);

        //Read the minecraft world saves directory

        var files = await fs.readdir(path.join(config.minecraftpath, "saves"));

        //Go through every world config, get the time played and tally it up!

        var totalTicks = 0;

        var x;
        var found = false;
        for(x of files) {
            found = false;
            var wfiles
            var wconfig
            var parsed
            try {
                var wfiles = await fs.readdir(path.join(config.minecraftpath, "saves", x, "stats"))
                var wconfig = await fs.readFile(path.join(config.minecraftpath, "saves", x, "stats", wfiles[0]), "utf8");
                var parsed = JSON.parse(wconfig);
            } catch (error) {

            }
            try {
                if(parsed.stats["minecraft:custom"]["minecraft:total_world_time"]) {
                    //console.log("Found", x, parsed.stats["minecraft:custom"]["minecraft:total_world_time"]);
                    totalTicks = totalTicks + parsed.stats["minecraft:custom"]["minecraft:total_world_time"];
                    found = true;
                }
            } catch (error) {
                
            }

            try {
                if(parsed["stat.playOneMinute"]) {
                    totalTicks = totalTicks + parseInt(parsed["stat.playOneMinute"]);
                    //console.log("Found", x, parsed["stat.playOneMinute"])
                    found = true;
                }
            } catch (error) {
                
            }
    
            try {
                if(parsed.stats["minecraft:custom"]["minecraft:play_one_minute"]) {
                    var num = parsed.stats["minecraft:custom"]["minecraft:play_one_minute"];
                    totalTicks = totalTicks + parseInt(num);
                    //console.log("Found", x, num);
                    found = true;
                }
            } catch (error) {
                
            }

            console.log(x);
            if(!found) {
                console.log("Not found", x);
            }

                //console.log(x, parsed);
                
        }
        
        var title = document.querySelector("#main-container > div.time-counter > div.total > p");
        var seconds = Math.round(totalTicks/20);
        var time = convertHMS(seconds);
        console.log(time)
        console.log(seconds);
        setTimeout(()=>{

            title.innerHTML = time[0] + " hours " + time[1] + " minutes " + time[2] + " seconds"; 
        }, 1000)
        
        var data = {
            singleplayertime: seconds,
            multiplayertime: 0
        }
        fs.writeFile(path.join(filesPath, "worlddata", "scannedplaytime.json"), JSON.stringify(data))
        .then(()=>{
            resolve();
        })
        .catch((error)=>{
            reject();
            console.error(error);
        })
    })

}

function convertHMS(value) {
    const sec = parseInt(value, 10); // convert value to number if it's string
    let hours   = Math.floor(sec / 3600); // get hours
    let minutes = Math.floor((sec - (hours * 3600)) / 60); // get minutes
    let seconds = sec - (hours * 3600) - (minutes * 60); //  get seconds
    // add 0 if value < 10; Example: 2 => 02
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return [hours,minutes,seconds]; // Return is HH : MM : SS
}


var timeout;
ipcRenderer.on("allow-checking-for-minecraft", (ev)=>{
    /*timeout = setTimeout(()=>{
        allowchecking = true;
    },1000) //Wait one minute before starting to search for minecraft things
*/
})

ipcRenderer.on("deny-checking-for-minecraft", (ev)=>{
    /*
    allowchecking = false;
    clearTimeout(timeout);
    */
})



var counting = false;
setInterval(()=>{
    if(!minecraftOpen) return;
    totalSeconds++;
    sessionTime++;
    updateTimeCounting(totalSeconds, sessionTime);
}, 1000)


function updateTimeCounting(main, session) {
    console.log(main, session);
    if(!isNaN(main)) {
        var title = document.querySelector("#main-container > div.time-counter > div.total > p");
        console.log(main)
        var c = convertHMS(main);
        console.log(c)
        title.innerText = c[0] + " hours " + c[1] + " minutes " + c[2] + " seconds ";
    }

    if(!isNaN(session)) {
        var sestext = document.querySelector("#main-container > div.time-counter > div.session > p");
        var c = convertHMS(session);
        sestext.innerHTML = "This session <span>" + c[0] + ":" + c[1] + ":" + c[2] + "</span>";
    }
}   


function saveSession() {
    return new Promise((resolve, reject)=>{

        //Get the session time
        var time = sessionTime; //In seconds
        totalSeconds = totalSeconds + sessionTime;
        sessionTime = 0;
        updateTimeCounting(undefined, 0);
        var date = new Date();
    
        var obj = {
            timePlayed: time,
            date: date
        }
        
        var fileName = date.getDate() + '' + parseInt(date.getMonth()+1) + '' + date.getFullYear() + '' + date.getHours() + '' + date.getMinutes() + '' + date.getSeconds();

        fs.writeFile(path.join(filesPath, "recordeddata", fileName + ".json"), JSON.stringify(obj,null,4))
        .then(()=>{
            resolve();
        })
        .catch((err)=>{
            reject(err);      
        })

        timeConfig.totalSessionTime

        if(isNaN(timeConfig.totalSessionTime)) {
            timeConfig.totalSessionTime = time; //sessionTime
        } else {
            timeConfig.totalSessionTime = timeConfig.totalSessionTime + time;
        }

        fs.writeFile(path.join(filesPath, "worlddata", "scannedplaytime.json"), JSON.stringify(timeConfig))
        .catch((err)=>{
            notification("Could not save session info to config. The session data is not lost.")
        })

    })
}