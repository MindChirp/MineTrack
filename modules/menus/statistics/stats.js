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

    if(userConfig.betaTester) {
        bWr.appendChild(regCalc);
    }
    regCalc.className = "smooth-shadow";

    regCalc.onclick = openAdvancedEstimateMenu;

/*
    var butt = document.createElement("button");
    butt.innerText = "Button";
    bWr.appendChild(butt);
    butt.className = "smooth-shadow";*/
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

var statsPaths = {
    time: [
        ["minecraft:custom","minecraft:total_world_time"],
        ["stat.playOneMinute"],
        ["minecraft:custom","minecraft:play_one_minute"]
    ],
    distance: [
        {
            walkonecm:[
                ["minecraft:custom", "minecraft:walk_one_cm"],
                ["stat.walkOneCm"]
            ]
        }
    ]
}

var properties;

async function showStatPage(index) {
    //Remove the contents
    //Read the statistic types from the statformats.json file
    //var stats = JSON.parse(await fs.readFile("statformats.json"), "utf8");

    var classes = [
        "total",
        "perWorld",
        "sessions"
    ]

    for(let i = 0; i < classes.length; i++) {
        if(i == index) {
            menu.querySelector(".content").classList.add(classes[i]);
        } else {
            menu.querySelector(".content").classList.remove(classes[i]);
        }
    }



    
    /*
        if index is
        -0 --> Show combined stats
        -1 --> Show world based stats
        -2 --> Show sessions

    */
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

//[["minecraft:custom", "minecraft:walk_one_cm"],["stat.walkOneCm"]]
    if(!properties.sessions) {
        var allWorlds = [];
        var createEntry = (path, property, scaling, title, icon)=>{
            return new Promise((resolve, reject)=>{
                
                //Get total distance walked
                retrieveStat(path,property)
                .then(async (res)=>{    
                    if(property.total) {
                        try {
                            var formatted = await replaceWithNames(res); //Replace the stat list that has been returned (that only contains uuids, and some usernames, into only usernames)
                        } catch (error) {
                            console.error(error)
                        }
                        if(!usernamesLoaded) {
                            var x;
                            for(x of formatted) {
                                if(!userNamesFound.includes(x.username)) {
                                    userNamesFound.push(x.username)
                                }
                                
                            }
                        }

                        var entry = returnBox();
                        var ico = document.createElement("i");
                        ico.className = "material-icons";
                        ico.innerText = icon;
                        entry.appendChild(ico);
                        
                        var p = document.createElement("span");
                        p.className = "full-size";
                        var span = document.createElement("span");
                        span.innerText = "...";
                        span.className = "value";
                        p.innerText = title;
                        p.appendChild(span);
                        
                        entry.values = formatted;
                        entry.multiplier = scaling;
                        //Handle value error gracefully
                        //var value = isNaN(result*scaling)?"Could not load":Math.round(result*scaling) + " " + title;
                        //p.innerText = value;

                        entry.querySelector(".wrapper").appendChild(p);

                        if(properties[Object.keys(properties)[0]] == property[Object.keys(property)[0]] && Object.keys(properties)[0] == Object.keys(property)[0]) {
                            resolve(entry);
                        } else {
                            reject();
                        }
                    } else if(property.perWorld) {
                        menu.querySelector(".content").innerHTML = "";
                        var x;
                        var h1 = document.createElement("p");
                        h1.innerText = "This page is under development";
                        menu.querySelector(".content.perWorld").appendChild(h1);
                        return;


                        for(x of res) {
                            await new Promise((resolve)=>{

                                if(allWorlds.filter(e=>e.name == x.name).length == 0) {
                                    allWorlds.push({name:x.name})
                                    //We will get returned all worlds per stat
                                    var entry = returnBox(true);
                                    menu.querySelector(".content").appendChild(entry);
                                    var name = document.createElement("p");
                                    name.className = "world-name";
                                    name.innerText = x.name;
                                    entry.querySelector(".wrapper").appendChild(name);
                                    var ul = document.createElement("div");
                                    ul.className = "ul";
                                    entry.querySelector(".wrapper").appendChild(ul);
                                    resolve();
                                } else {
                                    resolve();
                                }
                            })

                            var boxes = document.body.getElementsByClassName("stat-entry");
                            var val = x.value;


                            var p = document.createElement("p");
                            p.className = "world-stat";
                            p.innerHTML = "<span>" + Math.round((val * scaling)) + "</span> " + title;
                            
                            //Get the thing in the world array that matches this thing and things thangs
                            var index = allWorlds.findIndex(y => y.name == x.name);
                            boxes[index].querySelector(".wrapper > .ul").appendChild(p);
                        }

                    }
                })
                .catch((err)=>{
                    reject(err);
                })
                
                var returnBox = (world)=>{
                    
                    var el = document.createElement("div");
                    el.className = "stat-entry smooth-shadow";
                    var wr = document.createElement("div");
                    wr.className = "wrapper";
                    el.appendChild(wr);

                    if(world) {
                        el.classList.add("world-display");
                    }
                    
                    return el;
                }
            })
        }

        menu.querySelector(".content").innerHTML = "";

        var wrapper = document.querySelector("#main-container > div.menu-pane.statistics > div > div.content-wrapper > div.content.total")
        try {
            var el = await createEntry([["minecraft:custom", "minecraft:walk_one_cm"],["stat.walkOneCm"]], properties, 0.01, "Meters walked", "directions_walk")            
            wrapper.appendChild(el);
        } catch (error) {
            console.error(error);
        }

        try {
            var el = await createEntry([["minecraft:custom", "minecraft:sneak_time"],["stat.sneakTime"]],properties, (1/20), "Seconds sneaked", "elderly")
            wrapper.appendChild(el);
    } catch (error) {
            console.error(error);
        }

        
        try {
            var el = await createEntry([["minecraft:custom", "minecraft:mob_kills"],["stat.mobKills"]],properties, 1, "mobs killed", "shield")
            wrapper.appendChild(el);
    } catch (error) {
            console.error(error);
        }
        
        try {
            var el = await createEntry([["minecraft:custom", "minecraft:fly_one_cm"],["stat.flyOneCm"]],properties, (1/100), "meters flown", "flight")
            wrapper.appendChild(el);
        } catch (error) {
            console.error(error);
        }


        try {
            var el = await createEntry([["minecraft:custom", "minecraft:deaths"],["stat.deaths"]],properties, 1, "deaths", "personal_injury")
            wrapper.appendChild(el);
        } catch (error) {
            console.error(error);
        }

        try {
            var el = await createEntry([["minecraft:custom", "minecraft:total_world_time"],["stat.playOneMinute"], ["minecraft:custom", "minecraft:play_one_minute"]],properties, (((1/20)/60)/60), "hours played", "schedule")
            wrapper.appendChild(el);        
        } catch (error) {
            console.error(error);
        }

        try {
            var el = await createEntry([["minecraft:custom", "minecraft:jump"],["stat.jump"]],properties, 1, "times jumped", "north_east")
            wrapper.appendChild(el);       
        } catch (error) {
            console.error(error);
        }




        //Find the dropdown, and append the array
        var drDown = document.querySelector("#main-container > div.menu-pane.statistics > div > div.content-wrapper > div.fd-dropdown")
        
        if(!usernamesLoaded) {            
            drDown.remove("Loading users");
            drDown.add(userNamesFound);
            var obj = drDown.select(userConfig.username);
            if(!obj) {
                drDown.select(0);
            }
            drDown.reactivate();

            usernamesLoaded = true;
        }

        drDown.trigger((e)=>{
            loadDatasIntoStatEntries();
        })
        
        //After creating all the entries, load the data
        setTimeout(()=>{
            loadDatasIntoStatEntries();
        }, 200)
    } else {
        //Show the properties section
        var wrapper = document.querySelector("#main-container > div.menu-pane.statistics > div > div.content-wrapper > div.content.sessions")
        wrapper.innerHTML = "";
        var t = document.createElement("p");
        t.innerText ="This page is under development";
        wrapper.appendChild(t);
    }
    

}




module.exports = { statMenu, triggerTransition };