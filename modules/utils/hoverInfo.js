function createInfo({element, body, title, config}) {

    //Control the element types and contents
    if(!element || (!body && !title)) {
        return;
    }


    //Set the default values for the config object
    config = config || {position: "top"};
    config.position = config.position || "top";
    //End

    if(!(element instanceof HTMLElement)) {return;}
    if(typeof body != "string" && typeof title != "string") {return;}
    //End

    var el = document.createElement("div");
    el.className = "hover-info";

    el.innerText = body;
    el.config = config;

    //Set up custom things for the element
    element.hoverInfo = el;
    element.addField = addField;
    element.removeField = removeField;
    element.addEventListener("mouseenter", (e)=>{
        //Show the box

        var hoverInfo = e.currentTarget.hoverInfo;

        document.body.appendChild(hoverInfo);
        
        //Get the coordinates
        var elX;
        var elY;

        var elRect = e.currentTarget.getBoundingClientRect();

        elX = elRect.left + window.scrollX;
        elY = elRect.top + window.scrollY;

        //Add element width offset

        var x;
        var y;

        var infoMargin = 20; //in pixels
        var elStyle = window.getComputedStyle(e.currentTarget);

        var pos = hoverInfo.config.position;
        hoverInfo.classList.add(pos);


        if(pos == "right") {
            y = elY;
            x = elX + parseInt(elStyle.width.split("px")[0]) + infoMargin;
        } else if(pos == "top") {
            y = elY - parseInt(elStyle.height.split("px")[0]) - infoMargin;
            x = elX;
        } else if(pos == "bottom") {
            y = elY + parseInt(elStyle.height.split("px")[0]) + infoMargin;
            x = elX;
        } else if(pos == "left") {
            y = elY;
            x = elX - parseInt(elStyle.width.split("px")[0]) - infoMargin;
        } else {
            //Default to something if the config is not formatted correctly, for whatever reason
            y = elY;
            x = elX + parseInt(elStyle.width.split("px")[0]) + infoMargin;
        }
        
        hoverInfo.style.top = y + "px";
        hoverInfo.style.left = x + "px";


    })  

    element.addEventListener("mouseleave", (e)=>{
        var el = e.currentTarget.hoverInfo;
        el.parentNode.removeChild(el);
    })

    element.addEventListener("click", (e)=>{
        var el = e.currentTarget.hoverInfo;
        el.parentNode.removeChild(el);
    })

    
}


function addField() {
    //For editing the hover menu
}

function removeField() {

}

module.exports = { createInfo };