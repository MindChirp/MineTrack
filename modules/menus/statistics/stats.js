async function statMenu(el) {
    menu = await openMenu(el)
    menu.closest(".menu-pane").classList.add("statistics");
    try {
        var sessions = await fs.readdir(path.join(filesPath, "recordeddata"));
    } catch (error) {
        notification("Something went wrong");
    }

    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Statistics";
    menu.insertBefore(title, menu.querySelector(".content"));

    var info = document.createElement("span");
    info.innerText = "Info";
    info.className = "information-pill";
    var body = document.createElement("p");
    body.className = "body smooth-shadow";
    info.appendChild(body);
    body.innerHTML = `
        This page only shows statistics from your singleplayer worlds. Some worlds may not have statistics,
        and these are not included.
    `;
    title.appendChild(info);
    var drDown = madeInputs.createDropdown();
    menu.appendChild(drDown);
    drDown.add("Loading users");
    drDown.select("Loading users");
    if(usernamesLoaded == true) {
        drDown.remove("Loading users");
        drDown.add(userNamesFound);
        //Check if the users username is existent
        var ad = drDown;
        console.log(ad)
        var usr = userConfig.username + '';
        var isFound = drDown.select(usr);
        console.log(isFound)
        if(isFound == false) {
            //Select the first thing in the dropdown
            alert("asd")
            drDown.select(0);
        }
        drDown.reactivate();
    }
    drDown.style = `
        margin: auto;
        margin-top: 2rem;
    `;

    var selector = document.createElement("div");
    selector.className = "page-selector";
    menu.appendChild(selector);

    var b = document.createElement("button");
    selector.appendChild(b);
    b.innerText = "All time"
    b.className ="active"
    b.setAttribute("onclick", "triggerTransition(this)");

    var b = document.createElement("button");
    selector.appendChild(b);
    b.innerText = "Worlds"
    b.setAttribute("onclick", "triggerTransition(this)");

    var b = document.createElement("button");
    selector.appendChild(b);
    b.innerText = "Sessions"
    b.setAttribute("onclick", "triggerTransition(this)");

    var content = document.createElement("div");
    content.className = "content";
    menu.appendChild(content);

    showStatPage(0);

    //Create more buttons
    var bWr = document.createElement("div");
    bWr.className = "bottom-buttons-wrapper";
    menu.appendChild(bWr);

    var regCalc = document.createElement("button");
    regCalc.innerText = "Estimate all playtime";
    bWr.appendChild(regCalc);
    regCalc.className = "smooth-shadow";

    regCalc.onclick = openAdvancedEstimateMenu;

/*
    var butt = document.createElement("button");
    butt.innerText = "Button";
    bWr.appendChild(butt);
    butt.className = "smooth-shadow";*/
}

module.exports = statMenu;