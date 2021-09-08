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
    var menu = await openMenu(el)
    var t = document.createElement("h1");
    t.innerText = "Hello! My Name is Frikk.";
    menu.appendChild(t);

    var p = document.createElement("p");
    p.innerHTML = `
        I like to make programs. I guess you've realized that by now.
        <br><br>
        I made this program to fulfill a need, and I wanted to do it as good as I possibly could.
        <br><br>
        I <strong>really</strong> hope you enjoy it!

        <br><br><br>
        Contact info:<br>
        <strong>Email - </strong>frikk44@gmail.com        
    `

    menu.appendChild(p);
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