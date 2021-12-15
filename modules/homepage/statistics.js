const path = require("path");
const fs = require("fs-extra");

function drawSessionGraph() {
    if(!userConfig.betaTester) return;
    var canv = document.getElementById("stat-container").querySelector("#statistic");
    var ctx = canv.getContext("2d");
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#3C887E";
    var i = 0;
    ctx.setTransform(1,0,0,0.9,0,20);
    
    //Define some points
    var lines = [];
    var X = 10;
    var t = 100; //to control width of X
    for (var i = 0; i < 100; i++ ) {
        Y = Math.floor((Math.random() * 300));
        p = { x: X, y: Y };
        lines.push(p);
        X = X + t;
    }


    //plotGraphPoints({points:lines, ctx: ctx, size: 20, color: "blue"});
    //drawGraphMeta();
    fetchSessionData()
    .then(res=>{

        var multiplierGraphHeight = 0.0138;
        //Arrange the points according to age (date)
        //Add the same days into a combined poll
        var days = [];
        for(let i = 1; i <= 7; i++) {
            //Create the date object for the day we are checking
            console.log(i)
            var date = new Date();
            date.setTime(date.getTime()-(7-i)*24*60*60*1000);

            //Get the date we're dealing with
            for(let m = 0; m < res.length; m++) {
                var datDate = res[m].date;
                console.log(date.getDate())
                if(datDate.getDate() == date.getDate() && datDate.getFullYear() == date.getFullYear() && datDate.getMonth() == date.getMonth()) {
                    //This is the same day, add to an array
                    try {
                        var index = days.findIndex(item => item.x === i*(3000/6)-500);
                        if(index > -1) {
                            //We've found the object
                            days[index].y = days[index].y - (res[m].timePlayed*multiplierGraphHeight);
                        } else {
                            days.push({x:i*(3000/6)-500,y:300-(res[m].timePlayed*multiplierGraphHeight)});
                        }
                    } catch (error) {
                        console.error(error);
                    }
                } else {

                }
            }


            //Check if there exists an entry for this day
            try {
                var index = days.findIndex(item => item.x === i*(3000/6)-500);
                if(index == -1) {
                    days.push({x:i*(3000/6)-500,y:300});
                }
            } catch (error) {
                days.push({x:i*(3000/6)-500,y:300});
            }
            


        }
        

        //days
        //Now print to the graph!
        //plotGraphPoints({points:days, ctx: ctx, size: 20, color: "blue"});
        //console.log(days)
        bzCurve({points:days, f:0.3, t:0.2, ctx: ctx});


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




function gradient(a, b) {
    return (b.y-a.y)/(b.x-a.x);
}

function bzCurve({points, f, t, ctx}) {
    //f = 0, will be straight line
    //t suppose to be 1, but changing the value can control the smoothness too
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



module.exports = { drawSessionGraph }