function scanRes(file, title) {
    if(!file.formatVersion) {
        var ver = localStorage.getItem("app-version");
        notification(`Sorry! Scan files that are from v0.3.16 or earlier 
        are not supported in this version (` + ver + `). Try scanning the directory 
        again with the current program version.`,
        [{label: "Learn more", click: ()=>{
            var menu = stdMenu();
            var t = document.createElement("h1");
            t.className = "title";
            t.innerText = "Temporarily disabled";
            menu.appendChild(t);

            var p = document.createElement("p");
            p.className = "sub-title";
            p.innerHTML = `
                As this program evolves, some things might break. Other things are intentionally removed before they
                get the chance to break. Other times, its execution might have been too bad. 
                In this case, we are temporarily disabling older files, because they lack a lot of data, that we
                really need, to display interesting and useful statistics. We've recently made the leap to user-based statistics,
                and this feature isn't ready for that yet. Please hang tight while we resolve this! Thanks!
            `;
            p.style = `
                text-align: center;
                max-width: 100%;
                margin: auto;
            `
            menu.appendChild(p);
        }, important: true}]
        );
        return;
    }

    var format = file.formatVersion;
    if(parseInt(format.split(".")[1]) < 3 && parseInt(format.split(".")[2]) <= 16) {
        notification("Sorry! Scan files that are from v0.3.16 or earlier are not supported in this version. Try scanning the directory again with the current program version.");
        return;
    }



    var scanMenu = stdMenu();
    scanMenu.closest(".menu-pane").classList.add("view-scan-results");
    var t = document.createElement("h1");
    t.className = "title";
    t.style.marginBottom = "0";
    t.innerText = title;
    t.style.fontSize = "3rem";
    scanMenu.appendChild(t);

    var amt = document.createElement("p");
    amt.className = "sub-title";
    amt.style = `
        width: fit-content;
        padding: 0.2rem 0.5rem;
        border-radius: 0.25rem;
        text-align: center;
        margin: auto;
        margin-top: 0;
        margin-bottom: 0;
        background: #E0F2E9;
        color: #3C887E;
    `
    if(file.scans.res.length < 1) {
        amt.innerText = "No worlds found";
        return;
    }
    console.log(file);
    amt.innerText = file.scans.res.length + " Worlds found";
    scanMenu.appendChild(amt)


    var dropDownWrapper = document.createElement("div");
    dropDownWrapper.className = "drop-down-wrapper";
    scanMenu.appendChild(dropDownWrapper);

    var dr1 = madeInputs.createDropdown(["All worlds", {label: "Loading worlds...", interactive: false, divider: true}]);
    var dr2 = madeInputs.createDropdown([{label: "Loading users...", interactive: false}]);
    dropDownWrapper.appendChild(dr1);
    dropDownWrapper.appendChild(dr2);

    var worlds = file.scans.res;
    var x;
    var totalTime = 0;
    for(x of worlds) {
        totalTime = totalTime + x.value;
    }

    var p = document.createElement("p");
    var time = convertHMS(totalTime/20);
    p.innerText = time[0] + " Hours " + time[1] + " Minutes and " + time[2] + " seconds played";
    //scanMenu.appendChild(p); 

    p.style = `
        text-align: center;
        margin: auto;
        margin-top: 2rem;
    `;

    var info = document.createElement("p");
    info.innerText = "This page will get more content soon!";
    info.style = `
        padding: 0.5rem 1rem;
        border-radius: 1rem;
        background: #E0F2E9;
        margin: auto;
        text-align: center;
        color: #3C887E;
        margin-top: 0.5rem;
    `;
    scanMenu.appendChild(info);

    
}

module.exports = scanRes;