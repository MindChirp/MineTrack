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
            resolve();
        }, 500)
    })
}


async function stats(el) {
    await openMenu(el)
}

async function worlds(el) {
    await openMenu(el)
}

async function about(el) {
    await openMenu(el)
}

async function settings(el) {
    await openMenu(el)
}

function getOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY
    };
  }