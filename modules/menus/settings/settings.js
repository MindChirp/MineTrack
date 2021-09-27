async function settingsMenu(el) {

    var menu = await openMenu(el)
    menu.closest(".menu-pane").classList.add("settings");
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Settings";
    menu.appendChild(title);

    if(typeof userConfig != "object") {
        notification("Could not display settings");
        return;
    }

    var paths = document.createElement("div");
    paths.className = "path-selection-box";

    var t = document.createElement("p");
    t.innerText = "Minecraft path";
    paths.appendChild(t);

    var box = document.createElement("div");
    box.className = "path-out smooth-shadow";
    box.style = `
        margin-right: 1rem;
    `
    paths.appendChild(box);
    var p = document.createElement("p");
    box.appendChild(p);
    p.innerText = userConfig.minecraftpath;
    menu.appendChild(paths);

    var browse = document.createElement("button");
    browse.className = "smooth-shadow";
    browse.style = `
    `
    browse.innerText = "Browse";
    paths.appendChild(browse);
    browse.addEventListener("click", ()=>{
        openDirectoryModal2()
        .then(async (res)=>{
            box.children[0].innerText = res;
            userConfig.minecraftpath = res;
            try {
                await saveUserConfig(); 
                notification("Saved new minecraft path")
            } catch (error) {
                console.log(error);
                notification("Could not save the path choice");
            }

        })
        .catch((err)=>{
            notification("Could not fetch the path");
        })
    })

    var appV = document.createElement("p");
    appV.innerText = "App version - " + localStorage.getItem("app-version");
    menu.appendChild(appV);
    appV.style = `
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        opacity: 0.5;
        margin: 0;
    `;

    divider();

    var t = document.createElement("p");
    t.innerText = "Lost track of your total playtime?",
    menu.appendChild(t);
    t.style = "margin-bottom: 0.2rem";

    var reCalc = document.createElement("button");
    reCalc.innerText = "recalculate";
    reCalc.className = "smooth-shadow";
    menu.appendChild(reCalc);

    reCalc.addEventListener("click", async ()=>{

        var newObj = {
            username: userConfig.username,
            uuid: userConfig.uuid,
            logsCalculated: false,
            termsAccepted: userConfig.termsAccepted,
            minecraftpath: userConfig.minecraftpath
        }

        var newObj1 = {
            multiplayertime: 0,
            singleplayertime: 0,
            totalSessionTime: 0
        }

        try {
            await saveUserConfig(newObj);
            await saveTimeConfig(newObj1);
            timeConfig = newObj1;
            userConfig = newObj;
            totalSeconds = 0;

        } catch (error) {
            notification("Failed to update user config");
            return;
        }

        try {
            await gatherWorldInformation()
        } catch (error) {
            notification("Could not recalculate")
        }

        try {
            await scanLogFiles();
        } catch (error) {
            notification("Could not rescan log files");
        }


    })


    divider();


    var p = document.createElement("p");
    p.innerText = "Minecraft username";
    menu.appendChild(p);
    p.style = `
        margin-top: 0.5rem;
    `
    var usrName = document.createElement("input");
    usrName.value = userConfig.username;
    usrName.type = "text";
    usrName.className = "smooth-shadow";
    menu.appendChild(usrName);

    usrName.addEventListener("change", async (e)=>{
        //Update the userConfig, but first get the uuid
        var name = e.target.value;
        try {
            var uuid = await getId(e.target.value);
        } catch (error) {
            notification("Could not change username");
            return;
        }

        var protObj = userConfig;
        protObj.username = name;
        protObj.uuid = uuid;
        try {
            await saveUserConfig(protObj);
        } catch (error) {
            notification("Could not save to userConfig");
            return;
        }

        userConfig.username = name;
        userConfig.uuid = uuid;
        notification("Username and uuid has been changed. It is recommended to recalculate the playtime.");
        id.innerHTML = "UUID: <br>" + userConfig.uuid;

    })

    var shownOnce = false;
    usrName.addEventListener("focus", ()=>{
        if(shownOnce) return;
        notification("Be careful - Enter your username correctly!");
        shownOnce = true;
    })

    var id = document.createElement("p");
    id.innerHTML = "UUID: <br>" + userConfig.uuid;
    menu.appendChild(id);
    id.style = `
        margin-top: 0.5rem;
    `

    var div = divider();
    div.style = `
        margin-bottom: 1rem;
    `

    var adv = document.createElement("button");
    adv.innerText = "Advanced settings";
    menu.appendChild(adv);
    adv.className = "smooth-shadow";
    adv.style = `
        display: inline-block;
    `
    adv.addEventListener("click", ()=>{
        advancedSettings();
    })



    var reset = document.createElement("button");
    reset.innerText = "Reset program";
    menu.appendChild(reset);
    reset.className = "smooth-shadow";
    reset.style = `
        margin-left: 1rem;
    `

    var clickedAgain = false;
    reset.addEventListener("click", async ()=>{
        if(!clickedAgain) {
            notification("Click again to confirm");
            clickedAgain = true; 
            setTimeout(()=>{
                clickedAgain = false;
            }, 5000)
            return;
        }
        try {
            await resetAppFiles();
        } catch (error) {
            notification("Could not reset the program");
            return;
        }

        relaunchProgram();
    })

    var div = divider();
    div.style.marginBottom = "1rem";

    var suggestions = document.createElement("button");
    suggestions.className = "smooth-shadow";
    suggestions.innerText = "Submit suggestions and feedback";
    menu.appendChild(suggestions);
    suggestions.addEventListener("click", ()=>{
        window.open("https://docs.google.com/forms/d/e/1FAIpQLScayFoOCius_uZO2IT3-T7Uc9zFiA3L4TrjQz0dljcNKXRzEw/viewform?usp=sf_link");
    })

    function divider() {
        var div = document.createElement("div");
        div.className = "divider";
        menu.appendChild(div);
        return div;
    }

}

module.exports = settingsMenu;