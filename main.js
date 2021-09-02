const { ipcRenderer } = require("electron");
const path = require("path");

const fs = require("fs-extra");
var filesPath;

ipcRenderer.on("files-path", (ev, data)=>{
    filesPath = data;
    localStorage.setItem("files-path", filesPath);
});

window.onload = ()=>{
    filesPath = localStorage.getItem("files-path");

    checkResources();

}

var folders = [
    /*"configs",*/
    "worlddata",
    "recordeddata"
]
function createFolders() {
    return new Promise(async(resolve, reject)=>{
        var x;
        for (x of folders) {
            try {
                await fs.mkdir(path.join(filesPath, x))
            } catch (error) {
                reject(error);
            }
        }

        //All folders have been created
        resolve();
    })
}

function checkResources() {
    //Check if configs folder extists
    fs.access(path.join(filesPath, "configs"))
    .catch(()=>{
        //Does not exist, enter setup mode

        enterFirstTimeUse();

        createFolders()
        .then(()=>{
            
        })
        .catch((err)=>{
            console.log(err);
        })

    })
}


function closeProgram() {
    ipcRenderer.send("close-program")
    .then(()=>{
        console.log("closing");
    })
    .catch((err)=>{
        console.log(err);
    })
}

function enterFirstTimeUse() {
    var modal = document.createElement("div");
    modal.className = "first-time-setup";
    document.body.appendChild(modal);

    var title = document.createElement("h1");
    title.innerText = "Let's get started."
    modal.appendChild(title);
    title.className = "title";

    var wrapper = document.createElement("div");
    wrapper.className = "wrapper";
    modal.appendChild(wrapper);

    var progCounter = document.createElement("div");
    progCounter.className = "progress-counter";
    modal.appendChild(progCounter);
    progCounter.setPage = (page) => {
        //Get children
        var children = progCounter.getElementsByClassName("dot");
        //Deselct everyone
        var x;
        for(x of children) {
            x.classList.remove("selected");
        }

        children[page].classList.add("selected");
    }

    for(let x = 0; x < 4; x++) {
        var dot = document.createElement("div");
        dot.className = "dot";
        progCounter.appendChild(dot);
    }


    var step1 = ()=>{
        progCounter.setPage(0);
        var t = document.createElement("p");
        t.className = "sub-title";
        t.innerText = "Check if this path leads to your minecraft installation folder";

        var div = document.createElement("div");
        div.style = `
            margin: auto;
            width: fit-content;
            border-radius: 0.25rem;
            overflow: hidden;
        `;
        div.className ="smooth-shadow";
        var pathBox = document.createElement("div");
        pathBox.className = "path-output";
        var pText = document.createElement("p");
        pText.innerText = "Path text here";
        pathBox.appendChild(pText);
        div.appendChild(pathBox);

        var button = document.createElement("button");
        div.appendChild(button);
        button.innerHTML = "Browse";
        button.className = "browse-directory";

        wrapper.appendChild(t);
        wrapper.appendChild(div);
        

    }

    step1();


}