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
        menu.appendChild(tile);
        return tile;
    }

    var menu = stdMenu();
    menu.closest(".menu-pane").classList.add("advanced-settings");
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Advanced";
    menu.appendChild(title);


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

    var p = document.createElement("p");
    p.innerText = "Set background image";
    menu.appendChild(p);

}

module.exports = advSettingsMenu;