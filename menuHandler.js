function openMenu(el) {
    return new Promise((resolve)=>{

        //Create the menu open animation
        var exp = document.createElement("div");
        exp.className = "expanding-menu-transition-pane";
        document.getElementById("main-container").appendChild(exp);
        
        //Set the positions of exp
        var ofs = getOffset(el);
        
        //Add element width + height
        var style = window.getComputedStyle(el);
        var h = parseInt(style.height.split("px")) + 20;
        var w = parseInt(style.width.split("px"));
        exp.style.top = ofs.top + (h/2) + "px";
        exp.style.left = ofs.left + (w/2) + "px";
        

        setTimeout(()=>{
            var menu = document.createElement("div");
            menu.className = "menu-pane";
            var wr = document.createElement("div");
            wr.className = "wrapper";
            menu.appendChild(wr);
            menu.kill = ()=>{
                menu.parentNode.removeChild(menu);
            }

            var back = document.createElement("button");
            back.className = "button pill solid back secondary";
            back.innerHTML = "back";
            menu.appendChild(back);
            back.onclick = menu.kill;

            document.getElementById("main-container").appendChild(menu);
            exp.parentNode.removeChild(exp);
            resolve(wr);
        }, 250)
    })
}
var menu;

async function stats(el) {
    menu = await openMenu(el)
    var sessions = await fs.readdir(path.join(filesPath, "recordeddata"));

    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Statistics";
    menu.appendChild(title);

    var info = document.createElement("span");
    info.innerText = "Info";
    info.className = "information-pill";
    var body = document.createElement("p");
    body.className = "body smooth-shadow";
    info.appendChild(body);
    body.innerHTML = `
        Some worlds might not be scanned, either because its statistics file does not contain any relevant information,
        or because the world doesn't contain any statistics at all. This might be because your world is really old.
    `;
    title.appendChild(info);

    var topBar = document.createElement("div");
    topBar.className = "stat-top-bar";
    menu.appendChild(topBar)
    
    var t1 = document.createElement("h1");
    t1.innerHTML = sessions.length + " sessions recorded";
    topBar.appendChild(t1);

    var t2 = document.createElement("h1");
    t2.innerHTML = "statistic here";
    topBar.appendChild(t2);

    var t3 = document.createElement("h1");
    t3.innerHTML = "statistic here";
    topBar.appendChild(t3);

    var selector = document.createElement("div");
    selector.className = "page-selector";
    menu.appendChild(selector);

    var b = document.createElement("button");
    selector.appendChild(b);
    b.innerText = "All time"
    b.className ="active"
    b.setAttribute("onclick", "triggerTransition(this)");
    showStatPage(0);

    var b = document.createElement("button");
    selector.appendChild(b);
    b.innerText = "Worlds"
    b.setAttribute("onclick", "triggerTransition(this)");

    var b = document.createElement("button");
    selector.appendChild(b);
    b.innerText = "Sessions"
    b.setAttribute("onclick", "triggerTransition(this)");
}
var disableMenu = false;
function triggerTransition(el) {
    if(disableMenu) return;
    disableMenu = true;
    var slider = document.createElement("div");
    slider.className = "slider";

    var sel = el.closest(".page-selector");
    if(!(sel instanceof HTMLElement)) return;

    
    //Get the distance to travel
    
    //get the initial position
    var selected = sel.querySelector(".active");
    if(selected == el) {disableMenu = false; return;};
    el.closest(".page-selector").appendChild(slider);
    var x1 = selected.offsetLeft;
    slider.style.left = x1 + "px";
    setTimeout(()=>{
        slider.style.transition = "all 200ms ease-in-out";
        selected.classList.remove("active");
        var x = el.offsetLeft;
        slider.style.left = x + "px";
        setTimeout(()=>{
            el.classList.add("active");
            disableMenu = false;
            slider.parentNode.removeChild(slider);
            showStatPage(Array.from(sel.children).indexOf(el));
        }, 170)
    }, 100)
}

async function showStatPage(index) {
    //Read the statistic types from the statformats.json file
    var stats = JSON.parse(await fs.readFile("./statformats.json", "utf8"));

    
    /*
        if index is
        -0 --> Show combined stats
        -1 --> Show world based stats
        -2 --> Show sessions

    */
    var properties;
    switch(index) {
        case 0:
            properties = {total: true}
        break;
        case 1:
            properties = {perWorld: true}
        break;
        case 2:
            properties = {sessions: true}
        break;
    }

    //Get total distance walked
    retrieveStat([["minecraft:custom", "minecraft:walk_one_cm"],["stat.walkOneCm"]],properties)
    .then((res)=>{
        var text = document.createElement("p");
        //text.innerHTML = "CM walked " + res;
        menu.appendChild(text);
    })
    .catch((err)=>{
        console.log(err)
    })
    

}

async function worlds(el) {
    var menu = await openMenu(el)
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Worlds";
    menu.appendChild(title);
}

async function about(el) {
    var menu = await openMenu(el)
    var t = document.createElement("h1");
    t.innerText = "Hello! My Name is Frikk.";
    menu.appendChild(t);

    var p = document.createElement("p");
    p.innerHTML = `
        I like to make programs. I guess you've realized that by now.
        <br><br>
        I dont have much to say about this piece of software, other than that 
        I <strong>really</strong> hope you enjoy it!

        <br><br><br>
        Contact info:<br>
        <strong>Email - </strong>frikk44@gmail.com        
    `

    menu.appendChild(p);
}

async function settings(el) {
    var menu = await openMenu(el)
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Settings";
    menu.appendChild(title);
}

function getOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY
    };
  }