async function scanMenu(el) {

    var menu = await openMenu(el)
    menu.closest(".menu-pane").classList.add("scan");
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Scan";
    menu.appendChild(title);

    var info = document.createElement("div");
    var p = document.createElement("p");
    p.innerText = `
        Select the folder containing the worlds when scanning for statistics. Minecraft log files are not yet supported when scanning manually for files.
    `;
    info.appendChild(p);
    info.className = "information-paragraph";
    menu.appendChild(info);
    var ico = document.createElement("i");
    ico.innerHTML = "info";
    ico.className = "material-icons";
    info.appendChild(ico);

    var pathB = document.createElement("div");
    pathB.className = "path-selection-box";
    menu.appendChild(pathB);

    var t = document.createElement("p");
    t.innerText = "Select a directory to scan";
    pathB.appendChild(t);
    t.className = "sub-title";

    var out = document.createElement("div");
    out.className = "path-out smooth-shadow";
    pathB.appendChild(out);

    var p = document.createElement("p");
    p.innerHTML = "No path selected";
    out.appendChild(p);

    var browse = document.createElement("button");
    browse.innerText = "browse";
    browse.className = "rounded outline";
    browse.style = `
        margin-left: 0.5rem;
        vertical-align: top;
    `

    browse.onclick = openDirectoryModal1;

    var scan = document.createElement("button");
    scan.innerText = "scan directory";
    scan.className = "smooth-shadow";
    pathB.appendChild(scan);
    pathB.appendChild(browse);

    scan.style = `
        display: inline-block;
        vertical-align: top;
        margin-left: 1rem;
    `

    scan.addEventListener("click", ()=>{
        scanDirectory(scanPath)
        .then(async(res)=>{
            var appV = localStorage.getItem("app-version");
            //Add these to an object, and save this to a JSON-file
            var date = new Date();
            var obj = {
                meta:{
                date: date,
                directory: scanPath
                },
                scans:{
                    res
                },
                formatVersion: appV
            };



            var fileName = createFileName();

            try {
                await fs.writeFile(path.join(filesPath, "scans", fileName + ".json"), JSON.stringify(obj))
            } catch (error) {
                console.log(error);
                notification("Could not save session file");
            }

            //Update the session list
            try {
                await loadScans()
            } catch (error) {
                notification("Failed to update the scanned directories list");
            }
        })
        .catch((err)=>{
            notification(err);
        })
    })

    var res = document.createElement("div");
    res.className = "scan-result smooth-shadow";
    menu.appendChild(res);
    loadScans()
    .catch((err)=>{
        console.log(err);
        notification("Could not load scans");
    })
    var p = document.createElement("p");
    p.innerText = "Your scanned directories will appear here";
    res.appendChild(p);
    p.className = "empty"

    var dir = document.createElement("button");
    dir.className = "outline rounded";
    menu.appendChild(dir);
    dir.innerText = "Open scans folder";
    dir.style = `
        margin-top: 1rem;
    `;
    dir.addEventListener("click", ()=>{
        try {
            require('child_process').exec('start "" "' + path.join(filesPath, "scans"));
        } catch (error) {
            notification("Could not open the folder");
        }
    })

}




function createScanEntry(file) {
    var el = document.createElement("div");
    el.className = "entry";

    var parent = document.querySelector("#main-container > div.menu-pane.scan > div > div.scan-result.smooth-shadow");
    if(parent.querySelector(".empty")) {parent.innerHTML = "";}

    parent.appendChild(el);

    var date = new Date(file.meta.date);
    
    var days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ]
    
    var hours = date.getHours()<10?"0" + date.getHours():date.getHours();
    var minutes = date.getMinutes()<10?"0" + date.getMinutes():date.getMinutes();

    var title = hours + ":" + minutes + " " + days[date.getDay()-1] + " " + date.getFullYear();
    
    var p = document.createElement("p");
    p.innerHTML = title;
    el.appendChild(p);


    /*
        I KODEN NEDENFOR SKAL DU HOLDE PÅ, WILLIAM
    */
    el.addEventListener("click", ()=>{
        showFileScanResults(file, title);
    })

}


function showFileScanResults(file, title) {
    var scanRes = require("./scanres");
    scanRes(file, title);
} 

function loadScans() {
    return new Promise(async (resolve, reject)=>{

        try {
            var files = await fs.readdir(path.join(filesPath, "scans"))
        } catch (error) {
            console.log(error);
            reject(error);
        }
        if(files.length < 1) {resolve({scans: false}); return;}
        var x;
        var cont = document.querySelector("#main-container > div.menu-pane.scan > div > div.scan-result.smooth-shadow");
        cont.innerHTML = "";
        for(x of files) {
            try {
                var file = await fs.readFile(path.join(filesPath, "scans", x), "utf8");
            } catch (error) {
                console.log(error);
                reject(error);
            }

            createScanEntry(JSON.parse(file));
            resolve({scans: true});
        }
    })
}

function scanDirectory(path) {
    return new Promise((resolve, reject)=>{
        if(!(typeof path == "string")) {reject("No path")}
        if(path.length < 1) {reject("No path")}
        retrieveStat([["minecraft:custom", "minecraft:total_world_time"],["stat.playOneMinute"], ["minecraft:custom", "minecraft:play_one_minute"]],{perWorld:true},path)
        .then((res)=>{
            resolve(res);
        })
        .catch((err)=>{
            console.log(err);
            notification("Something went wrong while scanning your files");
        })
    })
}

module.exports = { scanMenu, scanDirectory, loadScans, showFileScanResults };