function scanRes(file, title) {
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
    scanMenu.appendChild(p); 

    p.style = `
        text-align: center;
        margin: auto;
        margin-top: 2rem;
    `;

    var info = document.createElement("p");
    info.innerText = "More data will be added to this page soon!";
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