const path = require("path");
const fs = require("fs-extra");

function drawSessionGraph() {
    if(!userConfig.betaTester) return;
    var canv = document.getElementById("stat-container").querySelector("#statistic");
    var ctx = canv.getContext("2d");
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#7FC7BD";
    var i = 0;
    ctx.setTransform(1,0,0,0.9,0,5);
    
    window.devicePixelRatio = 1;
    var scale = window.devicePixelRatio;
    ctx.scale(scale,scale);

    //Define some points
    var lines = [];
    var X = 10;
    var t = 100; //to control width of X
    for (var i = 0; i < 100; i++ ) {
        Y = Math.floor((Math.random() * canv.height/scale));
        p = { x: X, y: Y };
        lines.push(p);
        X = X + t;
    }

    //plotGraphPoints({points:lines, ctx: ctx, size: 20, color: "blue"});
    //drawGraphMeta();

    fetchSessionData()
    .then(res=>{

        var multiplierGraphHeight = canv.height/(6*60*60);
        //Arrange the points according to age (date)
        //Add the same days into a combined poll

        var days = [{x:-canv.width/6,y:0}];
        var arr = filterData({data: res, yMultiplier:multiplierGraphHeight, canvas: canv, scale: scale});
        console.log(arr);
        for(let i = 0; i < arr.length; i++) {
            days.push(arr[i]);
        }
        days.push({x:canv.width + canv.width/6,y:0})
        
        //Now print to the graph!
        //  plotGraphPoints({points:days, ctx: ctx, size: 20, color: "blue"});
        bzCurve({points:days, f:0.5, t:0, ctx: ctx});

        
    })
    .catch(err=>{
        console.error(err);
    })
}


function plotGraphPoints({points, ctx, size, color}) {

    for(let i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(points[i].x, points[i].y, size, 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();
    }

}


function fetchSessionData() {
    return new Promise((resolve, reject)=>{

        var dataPoints = [];

        //Get the session data from last seven days
        var sesPath = path.join(filesPath, "recordeddata");
        fs.readdir(sesPath)
        .then(async (dat)=>{
            
            //Read through each file, get the date
            for(let i = 0; i < dat.length; i++) {
                try {
                    var file = JSON.parse(await fs.readFile(path.join(sesPath, dat[i]), "utf8"));
                    //Enter the file date to a date object, and check if it should be
                    //Displayed in the graph
                    var date = new Date(file.date).getTime()*7/*days*/*24/*hours*/*60/*minutes*/*60/*seconds*/*1000/*milliseconds*/;
                    var now = new Date().getTime();

                    if(date >= now) {
                        //This is less than or equals to seven days ago.
                        dataPoints.push({date: new Date(file.date), timePlayed: file.timePlayed})
                    } else {
                        //Discard
                    }
                } catch (error) {
                    console.log(error);
                }      
            }

            resolve(dataPoints);
            
        })
        .catch((err)=>{
            console.log(err);
            reject(err);
        })
    })
}



function filterData({data, yMultiplier, canvas, scale}) {
    var days = [];
    for(let i = 1; i <= 7; i++) {
        //Create the date object for the day we are checking
        var date = new Date();
        date.setTime(date.getTime()-(7-i)*24*60*60*1000);
        //Get the date we're dealing with
        for(let m = 0; m < data.length; m++) {
            var datDate = data[m].date;
            if(datDate.getDate() == date.getDate() && datDate.getFullYear() == date.getFullYear() && datDate.getMonth() == date.getMonth()) {
                //This is the same day, add to an array
                try {
                    var index = days.findIndex(item => item.x === i*(canvas.width/scale/6)-(canvas.width/scale/6));
                    if(index > -1) {
                        //We've found the object
                        days[index].y = days[index].y - (data[m].timePlayed*yMultiplier);
                    } else {
                        days.push({x:i*(canvas.width/scale/6)-(canvas.width/scale/6),y:canvas.height-(data[m].timePlayed*yMultiplier)});
                    }
                } catch (error) {
                    console.error(error);
                }
            } else {

            }
        }


        //Check if there exists an entry for this day
        try {
            var index = days.findIndex(item => item.x === i*(canvas.width/scale/6)-(canvas.width/scale/6));
            if(index == -1) {
                days.push({x:i*(canvas.width/scale/6)-(canvas.width/scale/6),y:canvas.height/scale});
            }
        } catch (error) {
            days.push({x:i*(canvas.width/scale/6)-(canvas.width/scale/6),y:canvas.height/scale});
        }

    }

    return days;
}



function gradient(a, b) {
    return (b.y-a.y)/(b.x-a.x);
}

function bzCurve({points, f, t, ctx}) {
    //f = 0, will be straight line
    //t supposed to be 1, but changing the value can control the smoothness too
    if (typeof(f) == 'undefined') f = 0.3;
    if (typeof(t) == 'undefined') t = 0.6;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    var m = 0;
    var dx1 = 0;
    var dy1 = 0;

    var preP = points[0];
    for (var i = 1; i < points.length; i++) {
        var curP = points[i];
        nexP = points[i + 1];
        if (nexP) {
            m = gradient(preP, nexP);
            dx2 = (nexP.x - curP.x) * -f;
            dy2 = dx2 * m * t;
        } else {
            dx2 = 0;
            dy2 = 0;
        }
        ctx.bezierCurveTo(preP.x - dx1, preP.y - dy1, curP.x + dx2, curP.y + dy2, curP.x, curP.y);
        dx1 = dx2;
        dy1 = dy2;
        preP = curP;
    }
    ctx.stroke();
}


function filterForProcessing(data) {
    var days = [];
    for(let i = 1; i <= 7; i++) {
        //Create the date object for the day we are checking
        var date = new Date();
        date.setTime(date.getTime()-(7-i)*24*60*60*1000);
        //Get the date we're dealing with
        for(let m = 0; m < data.length; m++) {
            var datDate = data[m].date;
            if(datDate.getDate() == date.getDate() && datDate.getFullYear() == date.getFullYear() && datDate.getMonth() == date.getMonth()) {
                //This is the same day, add to an array
                try {
                    var index = days.findIndex(item => item.x === i);
                    if(index > -1) {
                        //We've found the object
                        days[index].y = days[index].y + data[m].timePlayed;
                    } else {
                        days.push({x:i,y:data[m].timePlayed});
                    }
                } catch (error) {
                    console.error(error);
                }
            } else {

            }
        }


        //Check if there exists an entry for this day
        try {
            var index = days.findIndex(item => item.x === i);
            if(index == -1) {
                days.push({x:i,y:0});
            }
        } catch (error) {
            days.push({x:i,y:0});
        }

    }

    return days;
}


async function calculateSessionStats() {
    //Get the last 7 sessions
    try {
        var res = await fetchSessionData()
    } catch (error) {
        //Error, but ignore it
        return;
    }

    var data = filterForProcessing(res);

    var statParent = document.querySelector("#stat-container > div > div.statistics");


    //Get average time per day last 7 days

    var total = 0;
    for(let i = 0; i < data.length; i++) {
        total = total + data[i].y;
    }

    //Divide total seconds by 7
    var avgSec = total / 7;
    //Get hours
    var avgHrs = (avgSec / 60 / 60).toFixed(1);
    //Get the element
    var pill = statParent.querySelectorAll('[key=average]')[0];
    pill.getElementsByTagName("dat")[0].innerText = avgHrs;
    //DONE



    //Get the total time the last 7 days
    //already found in the code above

    var totHrs = (total/60/60).toFixed(1);
    var pill = statParent.querySelectorAll('[key=total]')[0];
    pill.getElementsByTagName("dat")[0].innerText = totHrs;

    //DONE

    

    //Get the hours played today

    var todaySecs = data[data.length-1].y;
    var todayHrs = (todaySecs/60/60).toFixed(1);
    var pill = statParent.querySelectorAll('[key=today]')[0];
    pill.getElementsByTagName("dat")[0].innerText = todaySecs/60/60;

    //DONE

}



module.exports = { drawSessionGraph, calculateSessionStats }