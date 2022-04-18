
var multiplier = 100;
var userNamesFound = [];
var usernamesLoaded = false;
const { triggerTransition } = require("./modules/menus/statistics/stats");
const hoverMenu = require("./modules/utils/hoverInfo.js");


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

            //Create sidebar
            var sideBar = document.createElement("div");
            sideBar.className = "sidebar";
            wr.appendChild(sideBar);

            var contWr = document.createElement("div");
            contWr.className = "content-wrapper";
            wr.appendChild(contWr);

/*             var back = document.createElement("button");
            back.className = "button pill solid back secondary material-icons"; */

            var back = document.createElement("button");
            back.className = "back smooth-shadow";
            sideBar.appendChild(back);

            hoverMenu.createInfo({element: back, body: "Go back", config: {position: "right"}});


            var img = document.createElement("img");

            var imgPlaceHolder = new Image();
            imgPlaceHolder.onload = () =>{
                img.src = imgPlaceHolder.src;
                back.style.animation = `fade-in 200ms ease-in-out both 0.15s`
            }
            imgPlaceHolder.src = "icons/arrow_left.svg";
            back.appendChild(img);
            back.onclick = menu.kill;

            document.getElementById("main-container").appendChild(menu);
            exp.parentNode.removeChild(exp);
            resolve(contWr);
        }, 250)
    })
}
var menu;

async function stats(el) {
    var { statMenu } = require("./modules/menus/statistics/stats");
    statMenu(el);
}

function sleep(ms) {
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve();
        }, ms)
    })
}

async function openAdvancedEstimateMenu() {
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


function loadDatasIntoStatEntries() {
    var entries = document.querySelector("#main-container > div.menu-pane.statistics > div > div.content-wrapper > div.content").children;
    //Get the selected user!
    var drDown = document.querySelector("#main-container > div.menu-pane.statistics > div > div.content-wrapper > div.fd-dropdown")
    var val = drDown.value({index: false});
    var x;
    for(x of entries) {
        var vals = x.values;
        if(!Array.isArray(vals)) continue;
        var obj = vals.find(y => y.username === val);
        if(obj == undefined) {
            //there is not value for this stat for the selected user
            x.querySelector(".value").innerText = "Unknown amount of";
        } else {
            x.querySelector(".value").innerText = Math.round(obj.value * x.multiplier);
        }

    }
}

async function worlds(el) {

    //This menu has yet to be divided into a module.

    var menu = await openMenu(el)
    var title = document.createElement("h1");
    title.className = "title";
    title.innerText = "Worlds";
    menu.appendChild(title);
}

async function scan(el) {
    var { scanMenu, showFileScanResults } = require("./modules/menus/scan/scan");
    scanMenu(el);
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
    var settingsMenu = require("./modules/menus/settings/settings");
    settingsMenu(el); 
}


const inputs = {
    toggle: ()=>{
        var el = document.createElement("label");
        el.className ="switch";
        var inp = document.createElement("input");
        inp.type = "checkbox";
        el.appendChild(inp);
        var slider = document.createElement("span");
        slider.className = "slider";
        el.appendChild(slider);
        return el;
    },
    checkbox: ()=>{
        var el = document.createElement("label");
        el.className = "checkbox";
        var inp = document.createElement("input");
        inp.type = "checkbox";
        el.appendChild(inp);

        var ico = document.createElement("img");
        ico.className = "icon";
        el.appendChild(ico);
        ico.src = "icons/check.svg";

        var slider = document.createElement("span");
        slider.className = "transition-slider";
        el.appendChild(slider);
        return el;
    }
}

function advancedSettings() {
    var advSettings = require("./modules/menus/settings/advancedSettings");
    advSettings();

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

function saveSystemConfig(custom) {
    return new Promise(async(resolve, reject)=>{
        var config = systemConfig;
        if(custom) {
            config = custom;
        }
        try {
            await fs.writeFile(path.join(filesPath, "systemconfig.json"), JSON.stringify(config, null, 4))
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

    //Create sidebar
    var sideBar = document.createElement("div");
    sideBar.className = "sidebar";
    wr.appendChild(sideBar);

    var contWr = document.createElement("div");
    contWr.className = "content-wrapper";
    wr.appendChild(contWr);

    var back = document.createElement("button");
    back.className = "back";
    sideBar.appendChild(back);
    hoverMenu.createInfo({element: back, body: "Go back", config: {position: "right"}});


    var img = document.createElement("img");
    var imgPlaceHolder = new Image();
    imgPlaceHolder.onload = ()=>{
        img.src = imgPlaceHolder.src;
        back.style.animation = "fade-in 200ms ease-in-out both 0.15s";
    }
    imgPlaceHolder.src = "icons/arrow_left.svg";
    back.appendChild(img);
    back.addEventListener("click",()=>{
        menu.style.animation = "none";
        menu.style.animation = "slide-out-stdMenu 200ms ease-in-out both";
        setTimeout(()=>{
            menu.kill();
        }, 200)

    });

    document.getElementById("main-container").appendChild(menu);
    return contWr;
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



//Used to activate the custom dropdowns etc
const madeInputs = {
    functions: {
        labelClicked: function(e) {
            e.preventDefault();
            //Get radio buttons
            var opts = e.target.closest(".fd-dropdown").querySelector(".indicator").children;
            var y;
            for(y of opts){
                y.querySelector(".radio").checked = false;
            }

            //Then select the correct one
            
            var y;
            for(y of opts) {
                var ch = y.children;
                
                var m;
                for(m of ch) {
                    if(m.classList.contains(e.target.className)) {m.checked = true;}
                }
            }
        },
        dropDownValue: function(options) {
            options = options || {index: true}
            //Get the value of the element
            if(options.index) {
                var els = this.querySelector(".indicator").children;
                var x;
                var index = 0;
                for(x of els) {
                    if(x.querySelector(".radio").checked == true) {return index;}
                    index++;
                }
            } else {
                var els = this.querySelector(".indicator").children;
                var x;
                for(x of els) {
                    if(x.querySelector(".radio").checked == true) {return x.querySelector(".text").innerText}
                }
            }
        },
        selectValue: function(value) {
            //Get the mode
            //if integer, select with index, if string, select matching string
            if(typeof value == "number") {
                //Get every radio button
                var inps = this.querySelector(".indicator").getElementsByTagName("input");

                var x;
                for(x of inps) {
                    x.checked = false;
                }

                if(inps[value]) {
                    inps[value].checked = true;
                    return inps[value];
                } else {
                    return false;
                }
            } else if(typeof value == "string") {
                //Get all the list options
                var inps = this.querySelector(".indicator").getElementsByClassName("value");
                console.log(inps);
                var x;
                var index = 0;
                var found = false;
                var res;
                for(x of inps) {
                    console.log(x.querySelector(".text").innerText);
                    if(x.querySelector(".text").innerText == value) {
                        res = this.select(index);
                        found = true;
                    }
                    index++
                }

                if(found) {
                    
                    return res;
                } else {
                    return false;
                }

            }
        },
        addValue: function(name) {
            if(Array.isArray(name)) {
                //Is array
                var x;
                for(x of name) {
                    this.add(x);
                    
                }
            } else if(typeof name == "string") {
                //Is a single entry, string
                var inps = this.querySelector(".indicator").children;
                var el = document.createElement("div");
                el.className = "value";
                var inp = document.createElement("input");
                inp.className = "radio " + (inps.length);
                inp.type = "radio";
                el.appendChild(inp);
                var p = document.createElement("p");
                p.innerText = name;
                p.className = "text";
                el.appendChild(p);

                this.querySelector(".indicator").appendChild(el);

                //Create the label
                var lab = document.createElement("label");
                lab.innerText = name;
                lab.className = inps.length - 1;
                this.querySelector(".dropdown-pane").children[0].appendChild(lab);
                lab.addEventListener("click", ()=>{
                    
                })
            }
        },
        removeValue: function(value) {
            var arr = this.querySelector(".indicator").children;
            var x;
            for(x of arr) {
                if(x.querySelector(".text").innerText == value) {
                    //remove this one
                    x.parentNode.removeChild(x);
                    break;
                }
            }

            var arr = this.querySelector(".dropdown-pane").children[0].children;
            var x;
            for(x of arr) {
                if(x.innerHTML == value) {
                    x.parentNode.removeChild(x);
                }
            }
        },
        activateDropDown: function() {
            var labs = this.querySelector(".dropdown-pane").children[0].children;
            var x;
            for(x of labs) {
                x.addEventListener("click", (e)=>{
                    e.preventDefault();
                    //Get radio buttons
                    var opts = e.target.closest(".fd-dropdown").querySelector(".indicator").children;
                    var y;
                    for(y of opts){
                        y.querySelector(".radio").checked = false;
                    }
        
                    //Then select the correct one
                    
                    var y;
                    for(y of opts) {
                        var ch = y.children;
                        
                        var m;
                        for(m of ch) {
                            if(m.classList.contains(e.target.className)) {m.checked = true;}
                        }
                    }
                })
            }
        },
        handleClick: function(exp) {
            //Add event listener for every label button
            var labs = this.querySelector(".dropdown-pane").children[0].children;

            var x;
            for(x of labs) {
                x.addEventListener("click", (e)=>{
                    if(typeof exp == "function") {
                        exp(e)
                    } else {
                        return new Error("Function required");
                    }
                })
            }

        }
    },
    activateDropdown: function (el){
        if(!(el instanceof HTMLElement)) return;
        if(el.isActivated) return; //We don't want a double set of event listeners!

        var cont = el.querySelector(".dropdown-pane").children[0];
        var x;
        for(x of cont.children) {
            if(typeof x != "object") continue;

            x.addEventListener("click", (e)=>{
                this.functions.labelClicked(e);
            })
        }

        //Set up developer-facing features
        el.isActivated = true;
        el.select = this.functions.selectValue;
        el.value = this.functions.dropDownValue;
        el.add = this.functions.addValue;
        el.remove = this.functions.removeValue;
        el.reactivate = this.functions.activateDropDown;
        el.trigger = this.functions.handleClick;
    },
    createDropdown: function (opts) {
        var el = document.createElement("div");
        el.className = "fd-dropdown";

        var b = document.createElement("button");
        b.className = "show-list";
        var ico = document.createElement("img");
        ico.src = "icons/expand_more.svg";
        b.appendChild(ico);
        el.appendChild(b);

        var ind = document.createElement("div");
        ind.className = "indicator";
        el.appendChild(ind);

        var index = 0;
        var x;
        if(Array.isArray(opts)) {

            if(opts.length > 0) {
                
                for(x of opts) {

                    var enabled = true;
                    var divider = false;
                    if(typeof x == "object") {
                        var obj = x;
                        x = x.label;
                        if(!obj.interactive) {enabled = false;}
                        if(obj.divider) {divider = true;}
                    }

                    var a = document.createElement("div");
                    a.className = "value";
                    
                    var inp = document.createElement("input");
                    inp.type = "radio";
                    inp.className = "radio " + index;
                    
                    if(index == 0) {
                        inp.checked = true;
                    }
                    console.log(x);
                    index++;
                    a.appendChild(inp);
                    
                    var p = document.createElement("p");
                    p.innerText = x;
                    p.className = "text";
                    a.appendChild(p);
                    ind.appendChild(a);
                }
            }
        }
        
        var drop = document.createElement("div");
        drop.className = "dropdown-pane smooth-shadow";
        el.appendChild(drop);

        var ul = document.createElement("ul");
        drop.appendChild(ul);

        var x;
        var index = 0;
        if(Array.isArray(opts)) {

            if(opts.length > 0) {
                
                for(x of opts) {

                    var enabled = true;
                    var divider = false;
                    if(typeof x == "object") {
                        var obj = x;
                        x = x.label;
                        if(!obj.interactive) {enabled = false;}
                        if(obj.divider) {divider = true;}
                    }
                    
                    var a = document.createElement("label");
                    a.className = index+''; //to string
                    if(divider) {
                        a.classList.add("divider");
                    }
                    if(!enabled) {
                        a.classList.add("disabled");
                    }
                    a.innerText = x;
                    ul.appendChild(a);
                    index++;
                }
            }
        }

        this.activateDropdown(el);
        return el;
    }

}


module.exports = { saveUserConfig }