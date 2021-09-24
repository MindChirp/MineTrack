
const { ipcRenderer } = require("electron");
const path = require("path");
var { dbHandler } = require("./dbModule");


var allowchecking = true;
var fs = require("fs-extra");
var filesPath;
var appDataPath;
var minecraftOpen = false;
var totalSeconds = 0;
var sessionTime = 0;
var userConfig;
var timeConfig = {
    multiplayertime: 0,
    singleplayertime: 0,
    totalSessionTime: 0
};

module.exports = { filesPath };

var cachedNames;

var systemConfig;

var ongoingSession = false;


const folders = [
    "configs",
    "worlddata",
    "recordeddata",
    "scans",
    "logScans",
    "database"
];

const {gzip, ungzip} = require("node-gzip");

ipcRenderer.on("files-path", (ev, data)=>{
    filesPath = data;
    localStorage.setItem("files-path", filesPath);
});

ipcRenderer.on("app-version", (ev, data)=>{
    localStorage.setItem("app-version", data);
});
function gatherFilePath() {
    return new Promise((resolve, reject)=>{
        function loop() {

            try {
                filesPath = localStorage.getItem("files-path");
            } catch (error) {
                console.log(error);
            }
            
            if(filesPath != undefined) {
                //Get the userConfig
                resolve();
            } else {
                setTimeout(loop, 10)
            }
        }
        loop();

    })
}

window.onload = async ()=>{
    
    try {
        await gatherFilePath();
    } catch (error) {
        console.log(error);
        notification("Could not start up correctly");
        return;
    }

    appDataPath = path.dirname(filesPath);

    checkResources()
    .then(async ()=>{

        try {
            await loadData();
        } catch (error) {
            notification("Startup aborted");
            showErrorPage("Your startup was aborted", error);
            return;
        }
        startCheckingForMinecraft();
        checkLogFileStatus()
        .then(async(res)=>{
            if(res.notChecked) {
                try {
                    await scanLogFiles();
                    
                    //Show results
                    var mT = timeConfig.multiplayertime;
                    var conv1 = convertHMS(mT);

                    var sT = timeConfig.singleplayertime;
                    var conv2 = convertHMS(sT);

                    notification("Found " + conv1[0] + " multiplayer hours and " + conv2[0] + " singleplayer hours.");

                    checkForTermsAgreement();
                } catch (error) {
                    console.log(error);
                }
            } else {
                checkForTermsAgreement();
            }

            //Check for new features!
            checkForNewFeatures()
            .then((card)=>{
                updateSuggestions(card);
            })
            .catch((err)=>{
                updateSuggestions();
            })

            applyConfig();
        })
        .catch((err)=>{
            console.error(err);
        });
    })
}


function applyConfig() {
    return new Promise((resolve, reject)=>{
        //userConfig

        if(userConfig.autoSuggestions) {
            var el = document.querySelector("#main-container > div.fp-card.suggestions");
            el.style.display = "block";
        } else {
            var el = document.querySelector("#main-container > div.fp-card.suggestions");
            el.style.display = "none";
        }
    })
}


function checkForTermsAgreement() {
    if(userConfig.termsAccepted) {
        //OK
    } else {
        var menu = stdMenu();
        menu.parentNode.classList.add("terms");
        //Remove back button
        menu.parentNode.removeChild(menu.parentNode.querySelector(".back"));

        var title = document.createElement("h1");
        title.className = "title";
        title.innerText = "important";
        menu.appendChild(title);

        var p = document.createElement("p");
        p.innerHTML = `We see that you haven't agreed to our terms of use. 
            Because of this, we sadly can't let you use the program.
            Click the button below to restart the setup process, where you can accept the terms.
        `
        menu.appendChild(p);

        var reset = document.createElement("button");
        reset.className = "rounded outline smooth-shadow";
        reset.innerText = "Reenter setup";
        reset.style = `
            margin-top: 1rem;
        `
        menu.appendChild(reset);

        reset.addEventListener("click", async ()=>{

            notification("Resetting");
            
            try {
                await resetAppFiles();
            } catch (error) {
                notification("Could not reset stored data");
                return;
            }
    
            //When all is done, restart the program
            relaunchProgram();
            
        })    
        
    }
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
        try {
            await fs.access(path.join(userConfig.minecraftpath, "logs"))
        } catch (error) {
            reject("Logs not found!");
        }
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

        if(!files) reject("No logs");
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
            
            if(time > 0) {                    
                try {
                    //Save a log entry for this file
                    var stripped = x.replace(/[^0-9\-]/g,'');
                    var dataToSave = {
                        time: time,
                        date: stripped.split("-")[0] + "-" + stripped.split("-")[1] + "-" + stripped.split("-")[2],
                        index: stripped.split("-")[stripped.split("-").length-1]
                    }
                    if(stripped.replace(/[0-9]/g, "") != "---") { //Check if the file ends up with the correct name
                        totalPercentage = totalPercentage + percentageStep;
                        updateTimeCounting(totalSeconds + totalSecs); //kinda cool to see the time increment as the program scans the log files, might keep it
                        continue;
                    }
                    await fs.writeFile(path.join(filesPath, "logScans", stripped + ".json"), JSON.stringify(dataToSave));
                } catch (error) {
                    notification("Failed to save log file - " + x);
                }
            } 

            totalPercentage = totalPercentage + percentageStep;
            totalSecs = totalSecs + time;
            //Handle the contents of the file
            updateTimeCounting(totalSeconds + totalSecs); //kinda cool to see the time increment as the program scans the log files, might keep it
            
        }
        console.log(totalSecs, totalSeconds)

        console.log("Multiplayer time: ", totalSecs);
        //The code is done scanning the log files
        clearInterval(progInterval);
        totalSeconds = totalSeconds + totalSecs;

        box.style.animation = "none";
        box.style.animation = "slide-down-notification 300ms ease-in-out both 1s";
        setTimeout(()=>{
            box.parentNode.removeChild(box);
        }, 1300)

        userConfig.logsCalculated = true;
        timeConfig.multiplayertime = totalSecs;

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
            resolve();
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
        var list;
        try {
            list = await ipcRenderer.invoke("check-for-minecraft");
        } catch (error) {
            console.log("Failed to check for minecraft");
        }

        var res;
        var x;
        if(list.length > 0) {

            for(x of list) {
                if(x.bin != undefined) {

                    if(x.bin.toLowerCase().includes("minecraft") && x.bin.toLowerCase().includes("runtime")) {
                        res = true;
                    } else {
                        res = false;
                    }
                } else {
                    res = "unknown";
                }
            }
        } else {
            res = false;
        }


        if(res == true) {
            ongoingSession = true;
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
                var x;
                var on = false;
                for(x of check) {
                    try {
                        if(x.bin.toLowerCase().includes("minecraft") && x.bin.toLowerCase().includes("runtime")) {
                            on = true;
                        }
                    } catch (error) {
                        
                    }

                }
                if(!on) {
                    try {
                        await saveSession()
                        ongoingSession = false;
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
        } else if(res == "unknown") {
            //Nothing
        }
    }
    var delay = minecraftOpen?5000:2000;
    setTimeout(startCheckingForMinecraft, delay);
}


function notification(title) {
    var cont = document.getElementById("notification-container");
    var el = document.createElement("div");
    el.className = "notification smooth-shadow";

    var t = document.createElement("p");
    t.innerText = title;
    el.appendChild(t);

    if(cont.getElementsByClassName("notification")) {
        //There are already notifications existent. Insert above last notification
        var notifs = cont.getElementsByClassName("notification");

        cont.insertBefore(el, notifs[notifs.length-1]);
    } else {
        cont.appendChild(el);
    }

    setTimeout(()=>{
        el.parentNode.removeChild(el);
    }, 5000)
}


function loadData() {
    //Load the configs into the GUI
    return new Promise(async (resolve, reject)=>{

            try {
                var scanned = await fs.readFile(path.join(filesPath, "worlddata", "scannedplaytime.json"))
            } catch (error) {
            console.log(error);
            notification("Failed to load necessary files");
            reject(error)
        }
        try {
            timeConfig = JSON.parse(scanned);
        } catch (error) {
            notification("Malformed configuration files found");
        }
        
        //convert values to a good format
        totalSeconds = timeConfig.singleplayertime;
        if(!isNaN(timeConfig.totalSessionTime)) {
            totalSeconds = totalSeconds + timeConfig.totalSessionTime;
        }

        if(!isNaN(timeConfig.multiplayertime)) {
            totalSeconds = totalSeconds + timeConfig.multiplayertime;
        }
        updateTimeCounting(totalSeconds);

        //Load the userdata.json file!
        try {
            var data = await fs.readFile(path.join(filesPath, "configs", "userdata.json"), "utf8");
            userConfig = JSON.parse(data);
        } catch (error) {
            notification("Failed to load configuration file");
            reject(error)
        }

        try {
            systemConfig = JSON.parse(await fs.readFile(path.join(filesPath, "systemconfig.json")));
        } catch (error) {
            notification("Could not read system configuration files");
        }

        

        resolve();
    })
    
}

function createFolders() {
    return new Promise(async(resolve, reject)=>{
        var x;
        var i = 0;
        for (x of folders) { //Defined on the top of the page
            try {
                await fs.mkdir(path.join(filesPath, x))
                if(i==folders.length-1) {
                    //OK
                }
                i++;
            } catch (error) {
                console.log("Maybe that folder exists already?", x);    
            }
        }


        //Write files to folders

        var config = {
            username: setupInfo.username,
            uuid: setupInfo.uuid,
            minecraftpath: setupInfo.minecraftpath,
            termsAccepted: setupInfo.termsAccepted,
            autoSuggestions: true
        }

        userConfig = config;
        console.log(userConfig)
        try {
            await fs.writeFile(path.join(filesPath, "configs", "userdata.json"), JSON.stringify(config))
        } catch (error) {
            notification("Setup failed");
            reject(error);
        }

        resolve();
    })
}

function checkResources() {
    return new Promise((resolve, reject)=>{

        //Check if configs folder extists, if not enter setup
        //THIS CODE IS KINDA BAD AND FRAGILE, IT SHOULD BE FIXED!
        fs.access(path.join(filesPath, "configs"))
        .then(()=>{
            resolve();
        })
        .catch(async ()=>{
            //Does not exist, enter setup mode
            await enterFirstTimeUse();
            
            createFolders()
            .then(async ()=>{
                //Gather world information as part of the setup process
                try {
                    await gatherWorldInformation();
                } catch (error) {
                    notification("Could not load singleplayer time");
                    reject();
                }   
                resolve();
            })
            .catch((err)=>{
                notification("Could not check program resources");
                console.log(err);
                reject();
            })

        })
    })
}


function closeProgram() {
    ipcRenderer.send("close-program", "")
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

function relaunchProgram() {
    ipcRenderer.send("relaunch-program")
    .then(()=>{
        console.log("Relaunching");
    })
    .catch((err)=>{
        notification("Could not relaunch");
        console.log(err);
    })
}

var setupInfo = {
    minecraftpath: undefined,
    uuid: undefined,
    username: undefined,
    termsAccepted: false
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
                you will be guided through the initial setup process. You will be asked about your minecraft directory path, minecraft username, and terms agreement. It is important that you answer correctly on all of these questions.
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
            t.innerText = "Does this path lead to your Minecraft directory?";
            
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
            described in this body of text, is prohibited. The creator reserves his rights to disable any copy of the program if needed.
            This program scans through your minecraft game files, and tallies up the total play time from all of your worlds and logs. No data will at any point be sent to any servers. 
            The source code of this project can be found at github under the username MindChirp, as MineTrack.
            By clicking <strong>proceed</strong>, you agree to these terms.`
            wrapper.appendChild(policy);
            proceed.onclick = "";

            var nextPage = ()=> {
                setupInfo.termsAccepted = true;
                step3();
                proceed.removeEventListener("click", nextPage);
            }

            proceed.addEventListener("click", nextPage)
            
            calculateButtonPos();
        }

        async function step3() {
            progCounter.setPage(3);
            await cleanUp();
            proceed.onclick = async ()=>{
                //Get input values
                var name = usr.value;
                try {
                    var id = await getId(name)
                } catch (error) {
                    console.log(error);
                    notification("Player not found");
                    return;
                }


                if(name.trim().length == 0 || id.trim().length == 0) {
                    setupError("The field must have a value");
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
            you need to enter your minecraft username.`;
            wrapper.appendChild(info);

            var usr = document.createElement("input");
            usr.type = "text";
            usr.spellcheck = false;
            usr.placeholder = "Minecraft username"
            usr.className = "smooth-shadow";

            wrapper.appendChild(usr);
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
                When getting an initial estimate of your playtime, the program will include the playtime spent on servers as well. This can however take some time.
                When the program detects that you are in-game, however, everything you do inside of minecraft will be recorded as active playtime, even if you are idle in the start menu.
                <br>
                It is important that you have the program running to record your playtime. 
                
                It is also recommended to enable this program on startup. 
                
                To go through this setup process again, press the reset button in the settings menu. Doing this will reset all your user data.
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
    if(result.length < 1) return;
    var text = document.querySelector("body > div.first-time-setup > div.wrapper > div > div > p");
    if(text instanceof HTMLElement) {
        text.innerText = result;
    }

}


function getId(playername) {
    return fetch(`https://api.mojang.com/users/profiles/minecraft/${playername}`)
      .then(data => data.json())
      .then(player => player.id);
  }


function gatherWorldInformation() {
    return new Promise(async(resolve, reject)=>{

        try {
            var stat = await retrieveStat([["minecraft:custom", "minecraft:total_world_time"],["stat.playOneMinute"], ["minecraft:custom", "minecraft:play_one_minute"]], {total:true}, undefined)
        } catch (error) {
            reject(error);      
        }

        console.log(stat)
        var uuid = userConfig.uuid;
        var usrName = userConfig.username;
        var obj = stat.find(y => y.id === uuid);
        var obj1 = stat.find(y => y.id === usrName);

        console.log(obj, obj1)

        var secs = obj.value/20;
        if(obj1 != undefined) {
            secs = secs + (obj1.value/20)
        }

        console.log(secs);
        totalSeconds = totalSeconds + secs;
        updateTimeCounting(totalSeconds);
        //Update the config
        timeConfig.singleplayertime = secs;
        try {
            await fs.writeFile(path.join(filesPath, "worlddata", "scannedplaytime.json"), JSON.stringify(timeConfig));
        } catch (error) {
            reject(error);
        }

        resolve();

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


function updateMainProcessConfigs() {
    ipcRenderer.invoke("update-configs", "")
    .catch(()=>{
        notification("Could not update main process");
    })
}



var counting = false;
setInterval(()=>{
    if(!minecraftOpen) return;
    totalSeconds++;
    sessionTime++;
    updateTimeCounting(totalSeconds, sessionTime);
}, 1000)


function updateTimeCounting(main, session) {
    if(!isNaN(main)) {
        var title = document.querySelector("#main-container > div.time-counter > div.total > p");
        var c = convertHMS(main);
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

        //Check if there is an ongoing session
        if(!ongoingSession) reject("No session being recorded");

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
        
        var fileName = createFileName();

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


        //Show the session popup
        var pop = document.createElement("div");
        pop.className = "session-popup-finished";
        document.getElementById("main-container").appendChild(pop);

        var title = document.createElement("h1");
        title.innerText = "Nice job!";
        pop.appendChild(title);

        var p = document.createElement("p");
        var values = convertHMS(time);

        var string = "";

        if(values[0] != 0) {
            string = values[0] + " hours"
        }
        if(values[1] != 0 && values[0] == 0) {
            var app = values[1]==1?" minute":" minutes";
            string = values[1] + app
        } else if(values[1] != 0 && values[0] != 0) {
            var app = values[1]==1?" minute":" minutes";
            string = string + " " + values[1] + app;
        }

        if(values[0] == 0 && values[1] == 0) {
            string = "less than one minute";
        }
        
        if(string.trim().length == 0) {
            string = "an unknown period"
        }
        p.innerText = "That session lasted " + string + "!";
        pop.appendChild(p);
        setTimeout(()=>{
            pop.parentNode.removeChild(pop);
        }, 5000)
    })
}

function showErrorPage(title, errorstack) {
    var menu = stdMenu();
    menu.closest(".menu-pane").classList.add("error")
    var titleT = document.createElement("h1");
    titleT.className = "title";
    titleT.innerHTML = title;
    menu.appendChild(titleT);
    
    //Remove the default back button
    menu.parentNode.removeChild(menu.parentNode.querySelector(".back"));

    //Create standard error paragraph
    var p = document.createElement("p");
    p.innerHTML = `
        You're probably seeing this because something went critically wrong,
        and therefore the program couldn't continue to operate normally.
        Below, you will see additional error logging, and in the case that restarting the program
        does not fix the issue, you are strongly encouraged to report this
        issue on GitHub, with the error output below attached to the 
        issue ticket either as an image, or as plain text.

        <br><br>
        If the program refuses to return to normal operation, you can press <strong>reset user data</strong> to wipe all stored data. This should work in most cases.
    `;
    menu.appendChild(p);

    var error = document.createElement("div");
    error.className = "error-log";
    menu.appendChild(error);
    error.innerHTML = errorstack;

    var a = document.createElement("a");
    var gh = document.createElement("button");
    gh.className = "rounded smooth-shadow";
    gh.innerText = "Open github";
    a.style = `
        position: absolute;
        left: 1rem;
        bottom: 1rem;
    `;
    a.href = "https://github.com/MindChirp/minecraft-counter/issues/new";
    a.target = "_blank"
    a.appendChild(gh);
    menu.appendChild(a);

    var reset = document.createElement("button");
    reset.className = "outline rounded";
    reset.innerText = "Reset user data";
    reset.style = `
        position: absolute;
        right: 1rem;
        bottom: 1rem;
    `;
    menu.appendChild(reset);
    var oncePressed = false;
    reset.addEventListener("click", async ()=>{
        if(!oncePressed) {
            notification("Click the button again to confirm");
            oncePressed = true;
            return;
        }

        notification("Resetting");
        
        try {
            await resetAppFiles();
        } catch (error) {
            notification("Could not reset stored data");
        }

        //When all is done, restart the program
        relaunchProgram();
        
        
    })

}

function resetAppFiles() {
    return new Promise(async (resolve, reject)=>{
        //Delete the files

        var x;
        for(x of folders) { //Defined at the top of the page
            try {
                await fs.rmdir(path.join(filesPath, x), {recursive: true});
            } catch (error) {
                //OK
                console.log(error);
                console.log(x + " does not exist, or it couldn't be deleted");
            }
        }
        resolve();

    })
}


function createFileName() {
    var date = new Date();
    var fileName = date.getDate() + '' + parseInt(date.getMonth()+1) + '' + date.getFullYear() + '' + date.getHours() + '' + date.getMinutes() + '' + date.getSeconds();
    return fileName;
}

function closeSuggestion(el) {
    var cont = el.closest(".suggestion");
    cont.style.animation = "fade-out 200ms ease-in-out both";
    setTimeout(()=>{
        cont.parentNode.removeChild(cont);

        updateSuggestions();
    }, 200)
}

function updateSuggestions(card) {
    var cont = document.querySelector("#main-container > div.fp-card.suggestions");
    
    //Check if it has any content
    if(cont.querySelector(".wrapper").children.length == 0 && !(card instanceof HTMLElement)) {
        var p = document.createElement("div");
        p.className = "empty";
        var ico = document.createElement("img");
        ico.src = "icons/auto_awesome.svg"
        p.appendChild(ico);
        cont.querySelector(".wrapper").style.backgroundColor = "#C6E6E2";
        cont.querySelector(".wrapper").style.padding = "0.5rem";
        var t = document.createElement("p");
        t.innerText = "New features will be shown here once they are fresh out of the oven!";
        p.appendChild(t);
        //<i class='material-icons'>auto_awesome</i> <span>New features and suggestions will show up here.</span>
        cont.querySelector(".wrapper").appendChild(p);
    } else if(cont.querySelector(".wrapper").children.length == 0 && card instanceof HTMLElement) {
        cont.querySelector(".wrapper").appendChild(card)
    }
}

const reg = require("regression");

function performLinearRegression(data) {
    return new Promise((resolve, reject)=>{
        if(data.length < 2) {reject("Not enough data")};
        
        //So i'm gonna try to make my own linear regression code hmmmmm....
        var res = reg.linear(data);

        var grad = res.equation[0];
        var intercept = res.equation[1];
        resolve([grad, intercept]);

    })
}


function linearRegression(y,x){
    var lr = {};
    var n = y.length;
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var sum_yy = 0;

    for (var i = 0; i < y.length; i++) {

        sum_x += x[i];
        sum_y += y[i];
        sum_xy += (x[i]*y[i]);
        sum_xx += (x[i]*x[i]);
        sum_yy += (y[i]*y[i]);
    } 

    lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
    lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
    lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);

    return lr;
}

ipcRenderer.on("update-ready", (ev, data)=>{
    //An update has been found.
})


async function checkForNewFeatures() {
    return new Promise(async (resolve, reject)=>{

        //Try to access the feature file
        try {
            var features = JSON.parse(await fs.readFile(path.join(__dirname, "extraResources", "newFeatures.json"), "utf8"));
        } catch (error) {
            try {
                var features = JSON.parse(await fs.readFile(path.join(path.dirname(__dirname), "extraResources", "newFeatures.json"), "utf8"));
            } catch (error) {
                notification("Failed to check for new features");
                reject(error);
                return;
            }
                
        }


        //Get all the cards that have not been removed, and show the first one.
        var x;
        for(var key in features) {
            var y;
            var ind = 0;
            for(y of features[key]) {
                ind++
                if(y.removed == true) continue;
                var card = document.createElement("div");
                card.className = "suggestion smooth-shadow";
                var t = document.createElement("p");
                t.className = "title";
                t.innerText = y.title;
                card.appendChild(t);

                var p = document.createElement("p");
                p.className = "sub";
                p.innerText = y.body;
                card.appendChild(p);

                //Create the buttons

                var z;
                for(z of y.buttons) {
                    
                    var b = document.createElement("button");
                    b.innerText = z.label || "none";
                        
                    if(z.click != "close") {
                        b.setAttribute("onclick", z.click);
                        b.addEventListener("click", async(e)=>{
                            //Now don't suggest this button again
                            features[indexes[0]][indexes[1]].removed = true;
                            try {
                                await fs.writeFile(path.join(__dirname, "extraResources", "newFeatures.json"), JSON.stringify(features, null, 4));
                            } catch (error) {
                                try {
                                    await fs.writeFile(path.join(path.dirname(__dirname), "extraResources", "newFeatures.json"), JSON.stringify(features, null, 4));
                                    
                                } catch (error) {
                                    console.log(error);
                                    notification("Error");
                                }
                            }
                            
                            
                        })
                    } else {
                        var indexes = [key, ind-1]
                        b.addEventListener("click", async(e)=>{
                            //Save this to the json file
                            try {
                                features[indexes[0]][indexes[1]].removed = true;
                                console.log(features);
                                await fs.writeFile(path.join(__dirname, "extraResources", "newFeatures.json"), JSON.stringify(features, null, 4));

                                
                            } catch (error) {
                                try {
                                    await fs.writeFile(path.join(path.dirname(__dirname), "extraResources", "newFeatures.json"), JSON.stringify(features, null, 4));
                                } catch (error) {
                                    console.error(error);
                                    notification("Could not close");
                                    return;
                                }
                            }
                            //Close the suggestion
                            closeSuggestion(e.target);
                        })
                    }

                    switch(z.type) {
                        case 0:
                            b.classList.add("important"); 
                        break;
                        case 1:

                        break;
                    }

                    card.appendChild(b);
                }

                //var cont = document.querySelector("#main-container > div.fp-card.suggestions").querySelector(".wrapper");
                //cont.appendChild(card);
                resolve(card);
                

            }
        }
        resolve();
    })
    
}

function generateSuggestionCard(title, sub, buttons) {
    var card = document.createElement("div");
    card.className = "suggestion smooth-shadow";

    var t = document.createElement("p");
    t.className = "title";
    t.innerText = title;
    card.appendChild(t);

    var p = document.createElement("p");
    p.className = "sub";
    p.innerText = sub;
    card.appendChild(p);

    var x;
    for(x of buttons) {
        var b = document.createElement("button");
        b.innerText = x.label;
        b.setAttribute("onclick", x.click); 
        b.addEventListener("click", ()=>{
            b.closest(".suggestion").parentNode.removeChild(b.closest(".suggestion"));
        })

        switch(x.type) {
            case 0:
                b.classList.add("important")
            break;
        }
        card.appendChild(b);
    }

    return card;
}

ipcRenderer.on("request-autostart", (ev, arg)=>{
    var card = generateSuggestionCard("Add program to startup?", "MineTrack works best if it is added as a startup program. Do you want to do this now?", [{label: "add to startup", click: "acceptAutoStartup()", type: 0}, {label: "no thanks", click: "checkFeatures()", type: 1}])
    var cont = document.querySelector("#main-container > div.fp-card.suggestions > div") 
    cont.innerHTML = "";
    cont.appendChild(card);
    cont.style.backgroundColor = "transparent";
    cont.style.padding = "0";
    updateSuggestions();
})

function checkFeatures() {
    notification("We'll ask you again later.");
    checkForNewFeatures()
    .then((card)=>{
        updateSuggestions(card);
    })
}

async function acceptAutoStartup() {
    checkForNewFeatures()
    .then((card)=>{
        updateSuggestions(card);
    });
    var res = await ipcRenderer.invoke("enable-autostart");
    if(res == true) {
        notification("Enabled auto-startup!");
    }
}


ipcRenderer.on("backend-messages", (ev, data)=>{
    console.log(data);
})



//Test function for the MindBase
function createDb () {
    const { dbHandler } = require("./dbModule");

    dbHandler.create("test", path.join(filesPath, "database"))
    .then(async(db)=>{
        await db.CREATE("username", "string");        
        await db.CREATE("uuid", "string");
        await db.INSERT({username: "farlige_frikk", uuid: "1298371asdjabsd848"});        
        await db.INSERT({username: "Erland", uuid: "10823182iwsd1231"});

        var vals = await db.SELECT("username", "farlige_frikk");
        console.log(vals)
    })
    .catch(err=>{
        throw err;
    })
}
