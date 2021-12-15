function drawSessionGraph() {
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


    bzCurve({points:lines, f:0.5, t:0.5, ctx: ctx});
    plotGraphPoints({points:lines, ctx: ctx, size: 0, color: "blue"});
    //drawGraphMeta();

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