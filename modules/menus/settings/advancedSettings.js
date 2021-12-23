const { saveUserConfig } = require("../../../menuHandler");
const { notification } = require("../../../main");
const { getBetaRules } = require("../../../beta/betaRules.js");
const hoverMenu = require("../../utils/hoverInfo.js");

async function advSettingsMenu() {    
    //configuration variables: 
    //userConfig
    //systemConfig

    var switchTile = (title) =>{
        var tile = document.createElement("div");
        tile.className = "settings-tile";
        var p = document.createElement("p");
        p.innerText = title;
        tile.appendChild(p);
        var s1 = inputs.toggle();
        tile.appendChild(s1);
        s1.children[0].checked = systemConfig.enableTray;
        switches.appendChild(tile);
        return tile;
    }

    var menu = stdMenu();
    menu.closest(".menu-pane").classList.add("advanced-settings");
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Advanced";
    menu.appendChild(title);

    var switches = document.createElement("div");
    switches.className = "switches";
    menu.appendChild(switches);

    var t1 = switchTile("Minimize to system tray");
    t1.children[1].children[0].checked = systemConfig.enableTray;

    t1.children[1].addEventListener("change", (ev)=>{
        var val = ev.target.checked;
        systemConfig.enableTray = val;

        //If this one is clicked, the other MUST be false
        if(val == false) {
            t2.children[1].children[0].checked = false;
            systemConfig.startInTray = false;
            t2.children[1].classList.add("disabled")
        } else {
            t2.children[1].classList.remove("disabled");
        }


        saveSystemConfig()
        .then(()=>{
            updateMainProcessConfigs();
        })
        .catch((err)=>{
            notification("Could not update main process configs");
        })
    });



    var t2 = switchTile("Start in system tray");
    t2.children[1].children[0].checked = systemConfig.startInTray;
    t2.children[1].addEventListener("change", (ev)=>{
        var val = ev.target.checked;
        systemConfig.startInTray = val;
        saveSystemConfig()
        .then(()=>{
            updateMainProcessConfigs();
        })
        .catch((err)=>{
            notification("Could not update main process configs");
        })
    });

    if(systemConfig.enableTray == false) {
        t2.children[1].classList.add("disabled"); //Disable this toggle if the previous is disabled
    }

    var t3 = switchTile("Enable autosuggestions");
    t3.children[1].children[0].checked = userConfig.autoSuggestions;
    t3.children[1].addEventListener("change", (ev)=>{
        var val = ev.target.checked;
        userConfig.autoSuggestions = val;
        saveUserConfig();
        applyConfig();
    });

    var t4 = switchTile("Enable system logging");
    t4.children[1].children[0].checked = userConfig.sysLogging?true: false;
    t4.children[1].addEventListener("change", (ev)=>{
        var val = ev.target.checked;
        userConfig.sysLogging = val;
        saveUserConfig();
        applyConfig();
    });

    var t5 = switchTile("Opt into beta features");
    t5.children[1].children[0].checked = userConfig.betaTester?true: false;
    t5.children[1].addEventListener("change", async (ev)=>{
        var val = ev.target.checked;
        userConfig.betaTester = val;
        await saveUserConfig();
        getBetaRules();

        //Force system logging
        if(val == true) {
            t4.children[1].children[0].checked = true;
            t4.children[1].classList.add("disabled");
            userConfig.sysLogging = true;
            saveUserConfig();
        } else {
            t4.children[1].classList.remove("disabled");
        }
        applyConfig();
    });


    if(userConfig.betaTester) {
        t4.children[1].children[0].checked = true;
        t4.children[1].classList.add("disabled");
    }



    var t6 = switchTile("Notify when logging info");
    t6.children[1].children[0].checked = userConfig.notifyLogging?true: false;
    t6.children[1].addEventListener("change", async (ev)=>{
        var val = ev.target.checked;
        userConfig.notifyLogging = val;
        await saveUserConfig();
        applyConfig();
    });


    var p = document.createElement("p");
    p.innerText = "Background image";
    menu.appendChild(p);
    p.style = `
        margin-bottom: 0.5rem;
    `;
    p.className = "beta-feature";

    //Image selector
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.id = "bkg-selector";
    inp.style = `
        display: none;
    `
    var lab = document.createElement("label");
    lab.setAttribute("for", "bkg-selector");
    lab.innerText = "Select image";
    lab.className = "smooth-shadow beta-feature";
    menu.appendChild(inp);
    menu.appendChild(lab);
    hoverMenu.createInfo({element: lab, body: "Select background image (BETA)", config: {position: "right"}});
    

    var imgPath;
    lab.addEventListener("click", async (e)=>{
        e.preventDefault();
        try {
            var fP = await ipcRenderer.invoke("open-image-selector", "asd")
        } catch (error) {
            console.error(error);
            notification("Could not get image");
        }

        if(fP.length > 0) {
            imgPath = fP[0];
        } else {
            return;
        }

        //Proceed with showing the continue button
        c.style.display = "inline-block";
        
    })

    var c = document.createElement("button");
    c.innerText = "Next step";
    c.style = `
        text-transform: uppercase;
        color: #E0F2E9;
        margin: 0;
        margin-left: 1rem;
        display: none;
        background: transparent;
        line-height: 2rem;
    `;

    c.addEventListener("click", ()=>{
        showBkgPreview(imgPath);
    })

    var ico = document.createElement("img");
    ico.src = "./icons/arrow-right.svg";
    c.appendChild(ico);
    menu.appendChild(c);


    var dis = document.createElement("button");
    dis.innerText = "Remove background";
    dis.className = "smooth-shadow";
    dis.style = `
        display: block;
        margin-top: 0.5rem;
    `;

    if(userConfig.backgroundImage) {
        if(userConfig.backgroundImage.enabled) {
            menu.appendChild(dis);
        }
    }

    dis.addEventListener("click",async ()=>{
        userConfig.backgroundImage = undefined;
        saveUserConfig()
        .catch((err)=>{
            notification("This action won't be saved because of an internal error");
        })
        .then(()=>{
            notification("The background will be removed upon next program start")
        })

        
    })

}


async function showBkgPreview(file) {
    if(!file) return;
    var menu = await stdMenu();
    menu.closest(".menu-pane").classList.add("background-image-preview");

    var t = document.createElement("h1");
    t.innerText = "Image preview";
    t.className = "title";
    menu.appendChild(t);

    var img = document.createElement("div");
    menu.appendChild(img);
    img.className = "back-ground";

    var prC = document.createElement("div"); //previewContainer
    prC.className = "preview-container smooth-shadow";
    menu.appendChild(prC);

    var fG = document.createElement("img");
    fG.src = "./images/bkg-preview-blank.png";
    fG.className = "fore-ground";
    prC.appendChild(fG);
    //We need to copy over the file!
    //Check if the image folder exists
    try {
        await fs.access(path.join(filesPath, "images"))
    } catch (error) {
        //No such folder
        try {
            await fs.mkdir(path.join(filesPath, "images"));
        } catch (error) {
            notification("Couldn't show image");
            return;
        }
    }

    //Get the image suffix
    var suff = file.split(".")[file.split(".").length-1];
    //Copy the image
    fs.copyFile(path.join(file), path.join(filesPath, "images", "background." + suff))
    .then(async()=>{
        var file = await fs.readFile(path.join(filesPath, "images", "background." + suff), "base64");
        img.style.display = "none";
        
        var imgPlaceHolder = new Image();
        
        imgPlaceHolder.onload = ()=>{
            console.log(imgPlaceHolder.src);
            img.style.backgroundImage = "url('" + imgPlaceHolder.src + "')";
            img.style.display = "block";
        }
        imgPlaceHolder.src = "data:image/" + suff + ";base64," + file;
        
    })
    
    prC.appendChild(img);

    //Create the apply button and remove button
    var bts = document.createElement("div");
    bts.className = "buttons-wrapper";
    menu.appendChild(bts);

    var apl = document.createElement("button");
    apl.innerText = "apply";
    apl.className = "smooth-shadow";

    bts.appendChild(apl);

    apl.addEventListener("click", async ()=>{
        userConfig.backgroundImage = {enabled: true, ext: suff};
        await saveUserConfig();

        notification("The new background will be visible upon next program start");
    })

}

module.exports = advSettingsMenu;