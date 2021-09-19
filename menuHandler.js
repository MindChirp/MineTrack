
var multiplier = 100;

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
                menu.style.animation = "none";
                menu.style.animation = "fade-out 150ms ease-in-out both";
                setTimeout(()=>{
                    menu.parentNode.removeChild(menu);
                }, 150)
            }


            var back = document.createElement("button");
            back.className = "button pill solid back secondary material-icons";
            back.innerHTML = "arrow_back";
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

function sleep(ms) {
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve();
        }, ms)
    })
}

async function openAdvancedEstimateMenu() {
    //Close any open menu?
    /*
    var menus = document.getElementsByClassName("menu-pane");
    var x;
    if(menus.length > 0) {
        for(x of menus) {
            setTimeout(()=>{
                x.kill();
            }, 100)
        }
    }*/

    //await sleep(50);

    //Check if user has set up this function yet
    if(typeof userConfig != "object") {
        notification("Could not display advanced statistics");
        return;
    }


    if(!userConfig.startedPlaying) {

        var cleanUp = ()=>{
            setup.querySelector(".container").innerHTML = "";
        }


        var setup = await setupMenu();
        setup.definePages(2);
        setup.setPage(0);

        var t = document.createElement("h1");
        t.innerText = "set up feature";
        t.className = "title";
        setup.appendChild(t);

        var back = setup.closest(".menu-pane").querySelector(".back");
        back.style.color = "#E0F2E9";

        var cont = document.createElement("div");
        cont.className = "container";
        setup.appendChild(cont);

        var i = document.createElement("p");
        i.innerHTML = `
            If you wish to calculate all of your play time, even without having any log data or any worlds
            from the time you started playing Minecraft, this tool will give you an indication. <br><br>

            We will use your recorded log data, world data and the year 
            you originally started playing Minecraft 
            to calculate an estimate of your total playtime. 
            <br><br>
            Please note that this feature still is in early beta, and might not work properly. You will be notified on the main screen when it can be used.
        `
        cont.appendChild(i);
        i.className = "information";


        var proceed = document.createElement("button");
        proceed.innerText = "Proceed";
        proceed.className = "smooth-shadow next";
        setup.appendChild(proceed);

        proceed.onclick = ()=> {
            setup.setPage(1);
            cleanUp();
            step2();
        }


        function step2(){
            var i = document.createElement("p");
            i.innerHTML = "What year did you start to play Minecraft?";
            cont.appendChild(i);
            i.className = "information";

            var inp = document.createElement("input");
            inp.type = "number";
            inp.className = "smooth-shadow";
            inp.min = 2009;
            inp.max = new Date().getFullYear();
            cont.appendChild(inp);

            proceed.onclick = ()=>{

                var val = inp.value;
                if(val < 2009 || val > new Date().getFullYear()) {
                    //Invalid year selection
                    notification("Select a year between " + new Date().getFullYear() + " and 2009");
                    return;
                }

                userConfig.startedPlaying = inp.value;
                saveUserConfig();

                var menu = setup.closest(".menu-pane");
                menu.parentNode.removeChild(menu);
                openAdvancedEstimateMenu();
                notification("This menu can be accessed from 'Statistics' > 'Estimate all playtime'");
            };
            
        }

        await sleep(200);
        setTimeout(()=>{
            var menus = document.getElementsByClassName("advanced-statistics");
            for(let i = 0; i < menus.length; i++) {
                menus[0].parentNode.removeChild(menus[0]);
            }
        }, 100)
    }


    var menu = await stdMenu();
    menu.closest(".menu-pane").classList.add("advanced-statistics");

    var t = document.createElement("h1");
    t.innerText = "Advanced";
    menu.appendChild(t);
    t.className = "title";



    var graph = document.createElement("div");
    graph.className = "graph-output";
    menu.appendChild(graph);

    for(let i = 0; i < 3; i++) {
        var ind = document.createElement("div");
        ind.className = "graph-indicator";
        graph.appendChild(ind);
    }



    var canv = document.createElement("canvas");
    graph.appendChild(canv);
    canv.width = 4 * multiplier;
    canv.height = 1 * multiplier;

    var ctx = canv.getContext("2d");




    var info = document.createElement("div");
    info.className = "info-strip";
    menu.appendChild(info);


    /*
    var p = document.createElement("p");
    var year = document.createElement("input");
    year.type = "text";
    year.className = "year-input";
    menu.appendChild(year);
    */
    try {
        var logs = await fs.readdir(path.join(filesPath, "logScans"));
    } catch (error) {
        notification("Could not load log files");
    }

    //Get the oldest log
    var x;
    var years = [];
    for(x of logs) {
        var year = x.split("-")[0];
        years.push(year);
    }

    Array.min = function( array ){
        return Math.min.apply( Math, array );
    };

    var minimum = Array.min(years);

    var logsT = document.createElement("p");
    logsT.innerText = logs.length + " Logs scanned";
    info.appendChild(logsT);

    var first = document.createElement("p");
    first.innerText = "First log from " + minimum;
    info.appendChild(first);

    var first = document.createElement("p");
    first.innerText = "Started playing in " + userConfig.startedPlaying;
    info.appendChild(first);

    var times = []

    var x;
    for(x of logs) {
        try {
            var logFile = JSON.parse(await fs.readFile(path.join(filesPath, "logScans", x)));
        } catch (error) {
            notification("Could not read " + x);
        }
        /*
        
        var obj = {
            date: logFile.date,
            time: logFile.time
        }
        times.push(obj);
        */
        

        if(times.filter(e=>e.date == logFile.date).length == 0) {
            var obj = {
                date: logFile.date,
                time: logFile.time
            }
            times.push(obj);
        } else {
            var index = times.findIndex(item => item.date == logFile.date);
            times[index].time = times[index].time + logFile.time;

        }
        


    }

    console.log(times.length)

    //Get the object that should be placed first on the x-axis
    var date = new Date();
    var minXval = [parseInt(date.getFullYear())+10, 100, 100];
    var counter = 0;
    var x;
    for(x of times) {
        var split = x.date.split("-");
        var yr = split[0];
        var mon = parseInt(split[1])-1;
        var day = split[2];

        var minYr  = parseInt(minXval[0]);
        var minMon = parseInt(minXval[1]);
        var minDay = parseInt(minXval[2]);
        if(yr < minYr) {
            minXval = [yr, mon, day, counter];
            counter++
            continue;
        }

        if(yr <= minYr && mon <= minMon && day < minDay) {
            minXval = [yr, mon, day, counter];
            counter++
            continue;
        }

        if(yr <= minYr && mon < minMon) {
            minXval = [yr, mon, day, counter];
            counter++
            continue;
        }

    }


    var date = new Date();
    var maxXval = [0, 0, 0];
    var counter = 0;
    var x;
    for(x of times) {
        var split = x.date.split("-");
        var yr = split[0];
        var mon = parseInt(split[1])-1
        var day = split[2];

        var maxYr = parseInt(parseInt(maxXval[0]));
        var maxMon = parseInt(parseInt(maxXval[1]));
        var maxDay = parseInt(parseInt(maxXval[2]));
        if(yr > minYr) {
            maxXval = [yr, mon, day, counter];
            counter++
            continue;
        }

        if(yr >= maxYr && mon >= maxMon && day > maxDay) {
            maxXval = [yr, mon, day, counter];
            counter++
            continue;
        }

        if(yr >= maxYr && mon > maxMon) {
            maxXval = [yr, mon, day, counter];
            counter++
            continue;
        }

    }



    //All files have been scanned, and the data points can be plotted
    plotDataPoints(times, canv, minXval, maxXval)
    .then((res)=>{
        var p = document.createElement("p");
        p.innerText = "Regression expression - " + res.regEq;
        menu.appendChild(p);
        p.style = `
            animation: fade-in 200ms ease-in-out;
            margin-top: 1rem;
        `;

        //Create the numbers on the graph

        var inds = graph.getElementsByClassName("graph-indicator");

        var p = document.createElement("p");
        p.innerText = (res.upperVal/60/60).toFixed(1) + " hours";
        inds[0].appendChild(p);

        var p = document.createElement("p");
        p.innerText = (res.upperVal/2/60/60).toFixed(1) + " hours";
        inds[1].appendChild(p);

        var p = document.createElement("p");
        p.innerText = "0 hours";
        inds[2].appendChild(p);
    })
}

function plotDataPoints(times, canvas, minXval, maxXval) {
    return new Promise((resolve, reject)=>{

        var iteratorDate = new Date();
        var points = [];

        var xMax = 0;
        var yMax = 0;

        var testCode = false;

        //Calculate the amount of days between minXval and maxXval
        var minDate = new Date();
        var maxDate = new Date();

        minDate.setFullYear(minXval[0]);
        minDate.setMonth(minXval[1]);
        minDate.setDate(parseInt(minXval[2]));

        maxDate.setFullYear(maxXval[0]);
        maxDate.setMonth(maxXval[1]);
        maxDate.setDate(maxXval[2]);

        //Get MS between the two dates
        var ms = maxDate - minDate;
        var days = Math.floor(ms/1000/60/60/24)+2;
        iteratorDate = new Date();
        iteratorDate.setFullYear(minXval[0]);
        iteratorDate.setMonth(minXval[1]);
        iteratorDate.setDate(minXval[2]);

        var realDates = [];

        console.log(maxXval[0], maxXval[1], maxXval[2])
        console.log(days);
        var x;
        if(!testCode) {
            for(let i = 0; i < days;i++) {
                
                /*

                    GOAL: Put in a point at y=0 for every day where minecraft has not been played (or at least multiplayer)
                    without these points, we will only get the average from each minecraft session, and not each day.

                */

                //Get objects with this date value

                var yr = iteratorDate.getFullYear();
                var mon = iteratorDate.getMonth()+1;
                var day = iteratorDate.getDate();

                mon = mon<10?"0"+mon:mon;
                day = day<10?"0"+day:day;

                
                var currentDate = yr + "-" + mon + "-" + day;
                var ind = times.findIndex(item=>item.date == currentDate)
                //Get day difference
                var dDiff = Math.floor((iteratorDate - minDate)/1000/60/60/24);
                //Advanve the iteratordate by one day
                iteratorDate.setDate(iteratorDate.getDate()+1);

                //Check if there is an element that has its x value on the given day
                if(dDiff > xMax) {
                    xMax = dDiff
                }
                
                if(ind!=-1) {
                    realDates.push(times[ind].date)
                    if(times[ind].time > yMax) {yMax = times[ind].time} //Set the yMax if possible
                    points.push({x: dDiff, y: times[ind].time});
                } else {
                    points.push({x: dDiff, y: 0})
                    //The yMax won't be set in this case, because there will always be a value
                    //equal to or greater than zero.
                }
            }
            console.log(realDates.length)
            var z;
            var notFound = [];
            for(z of times) {
                var m;
                var found = false;
                for(m of realDates) {
                    if(z.date == m) {
                        found = true;
                    }
                }
                if(found == false) {
                    notFound.push(z.date);
                }
            }
            console.log(notFound)

        }

        if(testCode) {
            var pointss = 100;
            
            for(let i = 0;i<pointss;i++) {
                //Generate a random y value
                var x = (4*multiplier/pointss)*i
                var y = 2*i*(Math.random()+0.3)/1*multiplier;
                if(x > xMax) {xMax = x};
                if(y > yMax) {yMax = y};
                points.push({x:x, y:y}); 
            }

          /*  
            points = [{x:50,y:800},{x:3000,y:200}];
            xMax = 4000;
            yMax = 1000;
        */
        }

        //Convert these to values that fit on a canvas that is 4000*1000
        var c = canvas.getContext("2d");
        
        var yOffset = 0;
        var yScale = (1*multiplier)/yMax;
        var xScale = (4*multiplier)/xMax;
        var y;
        for(y of points) {
            var cX =(Math.round(y.x*xScale));
            var cY = 1*multiplier - yOffset - Math.round(yScale*y.y);

            console.log(cX, cY)
            c.beginPath();
            c.moveTo(cX,cY);
            c.arc(cX,cY,1,0, Math.PI*2);
            c.closePath();
            c.fillStyle = "#3C887E";
            c.strokeStyle = "#3C887E";
            c.fill();
            c.stroke();
        }

        var dataX = [];
        var dataY = [];
        var y;
        console.log(points);
        for(y of points) {
            dataX.push(parseInt(y.x));
            dataY.push(parseInt(y.y));
        }

        var reg = linearRegression(dataY, dataX);
        var y1 = expression(0, reg);
        var y2 = expression(4*multiplier,reg);

        var yAdj1 = y1*yScale;
        var yAdj2 = y2*yScale;
        var c = canvas.getContext("2d");
        c.beginPath();
        c.moveTo(0,(1*multiplier-yOffset)-yAdj1);
        c.lineTo(4*multiplier,(1*multiplier-yOffset)-yAdj2);
        c.closePath();
        c.strokeStyle = "#A17C6B";
        c.lineWidth = 2;
        c.stroke();

        function expression(x, res){
            return ((res.slope*x)+res.intercept);
        }

        var integral = require("sm-integral");
        
        function f(x) {
            return (reg.slope*x+reg.intercept);
        }


        resolve({regEq:"y=" + reg.slope + "x+" + reg.intercept, upperVal: yMax});

        /*
        performLinearRegression(data)
        .then((res)=>{
            //expression: y=mx+c res[0]=m, res[1]=c
            //Draw the line

            var y1 = expression(0, res);
            var y2 = expression(4000,res);

            var c = canvas.getContext("2d");
            c.beginPath();
            c.moveTo(0,1000-yOffset-(y1/yMax)*1000);
            c.lineTo(4000,1000-yOffset-(y2/yMax)*1000);
            c.closePath();
            c.strokeStyle = "#A17C6B";
            c.lineWidth = 15;
            c.stroke();

            function expression(x, res){
                return res[0]*x+res[1];
            }

            resolve("y=" + res[0] + "x+" + res[1]);
            
        })*/
    })

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

async function showStatPage(index) {
    //Remove the contents
    menu.querySelector(".content").innerHTML = "";
    //Read the statistic types from the statformats.json file
    //var stats = JSON.parse(await fs.readFile("statformats.json"), "utf8");

    
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
//[["minecraft:custom", "minecraft:walk_one_cm"],["stat.walkOneCm"]]
    if(!properties.sessions) {
        var allWorlds = [];
        var createEntry = (path, properties, scaling, title, icon)=>{
            return new Promise((resolve, reject)=>{

                //Get total distance walked
                retrieveStat(path,properties)
                .then(async (res)=>{
                    if(properties.total) {
                        var entry = returnBox();
                        var ico = document.createElement("i");
                        ico.className = "material-icons";
                        ico.innerText = icon;
                        entry.appendChild(ico);
                        
                        var p = document.createElement("p");
                        p.className = "full-size";
                        p.innerText = Math.round(res*scaling) + " " + title;
                        entry.querySelector(".wrapper").appendChild(p);
                        resolve(entry);
                    } else if(properties.perWorld) {
                        var x;
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

        var wrapper = document.querySelector("#main-container > div.menu-pane > div > div.content");
        createEntry([["minecraft:custom", "minecraft:walk_one_cm"],["stat.walkOneCm"]], properties, 0.01, "Meters walked", "directions_walk")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        createEntry([["minecraft:custom", "minecraft:sneak_time"],["stat.sneakTime"]],properties, (1/20), "Seconds sneaked", "elderly")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        
        createEntry([["minecraft:custom", "minecraft:mob_kills"],["stat.mobKills"]],properties, 1, "mobs killed", "shield")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })
        
        createEntry([["minecraft:custom", "minecraft:fly_one_cm"],["stat.flyOneCm"]],properties, (1/100), "meters flown", "flight")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        createEntry([["minecraft:custom", "minecraft:deaths"],["stat.deaths"]],properties, 1, "deaths", "personal_injury")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        createEntry([["minecraft:custom", "minecraft:total_world_time"],["stat.playOneMinute"], ["minecraft:custom", "minecraft:play_one_minute"]],properties, (((1/20)/60)/60), "hours played", "schedule")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

        createEntry([["minecraft:custom", "minecraft:jump"],["stat.jump"]],properties, 1, "times jumped", "north_east")
        .then((el)=>{
            wrapper.appendChild(el);
        })
        .catch((err)=>{
            console.log(err);
        })

    } else {
        //Show the properties section
        var wrapper = document.querySelector("#main-container > div.menu-pane > div > div.content");
        wrapper.innerHTML = "";
        var t = document.createElement("p");
        t.innerText ="There will be more content to be found soon!";
        wrapper.appendChild(t);
    }
    

}

async function worlds(el) {
    var menu = await openMenu(el)
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Worlds";
    menu.appendChild(title);
}

async function scan(el) {
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
            //Add these to an object, and save this to a JSON-file
            var date = new Date();
            var obj = {
                meta:{
                   date: date,
                   directory: scanPath
                },
                scans:{
                    res
                }
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

    el.addEventListener("click", ()=>{
        var scanMenu = stdMenu();

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
        amt.innerText = file.scans.res.length + " Worlds found";
        scanMenu.appendChild(amt)

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

    });

}

function loadScans() {
    return new Promise(async (resolve, reject)=>{

        try {
            var files = await fs.readdir(path.join(filesPath, "scans"))
        } catch (error) {
            console.log(error);
            reject(error);
        }
        console.log(files);
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
        console.log(typeof path);
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


function revealAllScans() {
    return new Promise((resolve, reject)=>{

    })
}

var scanPath;

async function openDirectoryModal1() {
    try {
        var result = await ipcRenderer.invoke("open-directory-modal", "pp");
    } catch (error) {
        notification("Could not open file dialog");
    }
    if(result.length < 1) return;
    //Set the path variable as well
    scanPath = result[0];

    var text = document.querySelector("#main-container > div.menu-pane > div > div > div > p")
    if(text instanceof HTMLElement) {
        text.innerText = result[0];
    }

}

async function settings(el) {




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
    t.innerText = "Minecraft path",
    paths.appendChild(t);

    var box = document.createElement("div");
    box.className = "path-out smooth-shadow";
    paths.appendChild(box);
    var p = document.createElement("p");
    box.appendChild(p);
    p.innerText = userConfig.minecraftpath;
    menu.appendChild(paths);

    var browse = document.createElement("button");
    browse.className = "smooth-shadow";
    browse.style = `
        margin-left: 1rem;
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

    var t = document.createElement("p");
    t.innerText = "Registered username and uuid",
    menu.appendChild(t);
    t.style = "margin-bottom: 0.5rem";

    var usrName = document.createElement("p");
    usrName.innerText = userConfig.username;
    menu.appendChild(usrName);

    var id = document.createElement("p");
    id.innerText = userConfig.uuid;
    menu.appendChild(id);


    divider();
    var reset = document.createElement("button");
    reset.innerText = "Reset program";
    menu.appendChild(reset);
    reset.style = `
        
    `;
    reset.className = "smooth-shadow";
    reset.addEventListener("click", async ()=>{
        try {
            await resetAppFiles();
        } catch (error) {
            notification("Could not reset the program");
            return;
        }

        relaunchProgram();
    })

    function divider() {
        var div = document.createElement("div");
        div.className = "divider";
        menu.appendChild(div);
    }

}

function saveUserConfig(custom) {
    return new Promise(async(resolve, reject)=>{
        var config = userConfig;
        if(custom) {
            config = custom;
        }
        try {
            await fs.writeFile(path.join(filesPath, "configs", "userdata.json"), JSON.stringify(config))
        } catch (error) {
            reject(error);
        }
        resolve();
    })
}

function saveTimeConfig(custom) {
    return new Promise(async(resolve, reject)=>{
        var config = timeConfig;
        if(custom) {
            config = custom;
        }
        try {
            await fs.writeFile(path.join(filesPath, "worlddata", "scannedplaytime.json"), JSON.stringify(config))
        } catch (error) {
            reject(error);
        }
        resolve();
    })
}

function openDirectoryModal2() {
    return new Promise(async (resolve, reject)=>{
        try {
            var result = await ipcRenderer.invoke("open-directory-modal", "pp");
        } catch (error) {
            reject(error);
        }
        if(result.length < 1) return;
        //Set the path variable as well
        resolve(result[0])
    })
}

function getOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY
    };
  }


  function stdMenu() {
    var menu = document.createElement("div");
    menu.className = "menu-pane non-transitioning std-menu smooth-shadow";
    var wr = document.createElement("div");
    wr.className = "wrapper";
    menu.appendChild(wr);
    menu.kill = ()=>{
        menu.parentNode.removeChild(menu);
    }


    var back = document.createElement("button");
    back.className = "button pill solid back secondary material-icons";
    back.innerHTML = "arrow_back";
    menu.appendChild(back);
    back.addEventListener("click",()=>{
        menu.style.animation = "none";
        menu.style.animation = "slide-out-stdMenu 200ms ease-in-out both";
        setTimeout(()=>{
            menu.kill();
        }, 200)

    });

    document.getElementById("main-container").appendChild(menu);
    return wr;
  }

function setupMenu() {
    return new Promise(async (resolve, reject)=>{
        var menu = await stdMenu();
        menu.closest(".menu-pane").classList.add("setup-menu");
          
        var page = document.createElement("div");
        page.className = "page-indicator";
        menu.parentNode.appendChild(page);

        menu.definePages = (num)=>{
            for(let i = 0; i < num; i++) {
                var el = document.createElement("div");
                el.className = "dot";
                page.appendChild(el);
            }
        }

        menu.setPage = (num) => {
            if(page.querySelector(".active")) {
                page.querySelector(".active").classList.remove("active");
            }
            page.children[num].classList.add("active");
        }

          resolve(menu);
        })
  }
