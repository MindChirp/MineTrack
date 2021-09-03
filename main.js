const { ipcRenderer } = require("electron");
const path = require("path");
const ps = require("ps-node");

const fs = require("fs-extra");
var filesPath;
var appDataPath;
ipcRenderer.on("files-path", (ev, data)=>{
    filesPath = data;
    localStorage.setItem("files-path", filesPath);
});

window.onload = async ()=>{
    filesPath = localStorage.getItem("files-path");
    appDataPath = path.dirname(filesPath);
    await checkResources();

    loadData();

    setTimeout(()=>{
        startCheckingForMinecraft()
    }, 600000)
}
notification("Checking for minecraft status. Please wait.")

async function startCheckingForMinecraft() {

    notification("Checking for minecraft status. Please wait.")
    var res = await checkForMinecraft();
    if(res == true) {
        var bar = document.querySelector("#main-container > div.menu-box > div.status-bar");
        var text = document.querySelector("#main-container > div.menu-box > div.status-text > p");
        text.innerText = "Minecraft is running"
        bar.style.backgroundColor = "green";
    } else {
        var text = document.querySelector("#main-container > div.menu-box > div.status-text > p");
        var bar = document.querySelector("#main-container > div.menu-box > div.status-bar");
        text.innerText = "Minecraft is not open"
        bar.style.backgroundColor = "rgb(200,20,20)";
    }
    
    setTimeout(startCheckingForMinecraft, 600000)
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
    
    //convert values to a good format
    var secs = JSON.parse(scanned).time;
    var formed = convertHMS(secs);

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
                    minecraftpath: setupInfo.minecraftpath
                }
                fs.writeFile(path.join(filesPath, "configs", "userdata.json"), JSON.stringify(data))
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

var setupInfo = {
    minecraftpath: undefined
}

function enterFirstTimeUse() {
    return new Promise((resolve, reject)=>{

        var modal = document.createElement("div");
        modal.className = "first-time-setup";
        document.body.appendChild(modal);
        
        var title = document.createElement("h1");
        title.innerText = "Let's get started."
        modal.appendChild(title);
        title.className = "title";
        
        var wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        modal.appendChild(wrapper);
        
        var div = document.createElement("div");
        div.className = "proceed-wrapper";
        var proceed = document.createElement("button");
        proceed.innerHTML = "proceed";
        proceed.className = "proceed smooth-shadow";
        div.appendChild(proceed);
        modal.appendChild(div);

        var progCounter = document.createElement("div");
        progCounter.className = "progress-counter";
        modal.appendChild(progCounter);
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
        
        for(let x = 0; x < 3; x++) {
            var dot = document.createElement("div");
            dot.className = "dot";
            progCounter.appendChild(dot);
        }
        
        
        function step1(){

            proceed.onclick = ()=>{
                //Save the path
                setupInfo.minecraftpath = pText.innerText;
                console.log(setupInfo);

                step2();
            };
            progCounter.setPage(0);
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
            
            
        }
        
        step1();

        function cleanUp() {
            return new Promise((resolve)=>{
                wrapper.style.animation = "fade-out 200ms ease-in-out both";
                setTimeout(()=>{
                    wrapper.innerHTML = "";
                    wrapper.style.animation = "none";
                    wrapper.style.animation = "fade-in 200ms ease-in-out both";
                    resolve();
                }, 200)
            })
        }

        async function step2(){            
            progCounter.setPage(1);
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
            
        }

        async function step3() {
            progCounter.setPage(2);
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
            `;
            wrapper.appendChild(info)

            proceed.innerText = "finish setup"

            proceed.onclick = ()=>{



                //Finish the setup
                resolve();
                modal.style.animation = "none";
                modal.style.animation = "fade-out 200ms ease-in-out both";
                setTimeout(()=>{
                    modal.parentNode.removeChild(modal);
                }, 200)

            }
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
        console.log(seconds);
        title.innerHTML = time[0] + " hours " + time[1] + " minutes " + time[2] + " seconds"; 
        
        var data = {
            time: seconds
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



function checkForMinecraft() {
    return new Promise((resolve, reject)=>{

        //Check if minecraft is running!
        ps.lookup({
            command:"infoscreen",
        },
        function(err, resultList) {
            if(err) {
                reject(err);
            }
            
            if(resultList.length == 0) {
                resolve(false)
            }
            
            resultList.forEach(function(process) {
                if(process) {
                    resolve(true);
                }
            });
        });
    })
}