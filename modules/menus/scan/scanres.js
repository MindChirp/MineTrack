async function scanRes(file, title) {
    var worlds = [];
    var users = [];

    if(!file.formatVersion || file.formatVersion == "0.3.16") {
        var ver = localStorage.getItem("app-version");
        notification(`Sorry! Scan files that are from v0.3.16 or earlier 
        are not supported in this version (` + ver + `). Try scanning the directory 
        again with the current program version.`,
        [{label: "Learn more", click: ()=>{
            var menu = stdMenu();
            var t = document.createElement("h1");
            t.className = "title";
            t.innerText = "Heads up";
            menu.appendChild(t);

            var p = document.createElement("p");
            p.className = "sub-title";
            p.innerHTML = `
                As this program evolves, some things might break. Other things are intentionally removed before they
                get the chance to break. Other times, its execution might have been too bad. 
                In this case, we are temporarily disabling older files, because they lack a lot of data, that we
                really need, to display interesting and useful statistics. We've recently made the leap to user-based statistics,
                and this feature isn't ready for that yet. Please hang tight while we resolve this! Thanks!
            `;
            p.style = `
                text-align: center;
                max-width: 100%;
                margin: auto;
            `
            menu.appendChild(p);
        }, important: true}]
        );
        return;
    }

    var format = file.formatVersion;
    if(parseInt(format.split(".")[1]) < 3 && parseInt(format.split(".")[2]) <= 16) {
        notification("Sorry! Scan files that are from v0.3.16 or earlier are not supported in this version. Try scanning the directory again with the current program version.");
        return;
    }


    var scanMenu = stdMenu();
    scanMenu.closest(".menu-pane").classList.add("view-scan-results");
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
    

    //Go through each world for each stat type, and add it to the world array if it isn't added
    var x;
    for(x of file.scans.res) {
        var y;
        for(y of x) {
            if(!worlds.includes(y.name) && y.name) {
                worlds.push(y.name);
            }

        }
    }

    amt.innerText = worlds.length + " Worlds found";
    scanMenu.appendChild(amt)

    var loading = document.createElement("h1");
    loading.innerText = "Loading statistics and users";
    scanMenu.appendChild(loading);
    loading.style = `
        background: rgb(224, 242, 233);
        border-radius: 0.5rem;
        text-align: center;
        margin: auto;
        color: #5B7B7A;
        margin-top: 1rem;
        max-width: unset;
    `;

    //Go through each user uuid, and check if it has been added to the user array
    var x;
    for(x of file.scans.res) {
        var y;
        for(y of x) {
            var z;
            if(!y.players) continue;
            for(z of y.players) {
                if(!users.includes(z.id) && z.id) {
                    users.push(z.id); //For now, just add uuid without object, and later add username
                }
            }
        }
    }

    /*

        Go through each uuid, check if it exists in db,
        if not, fetch username form mojang api, and
        add an entry to the db.

        Then save the new entry with uuid and username to an array

    */  

    var convertedUsrs = [];
    var { getNamesFromUUID } = require("../../../getStats");

    //Set up the database
    var { dbHandler } = require("../../../dbModule");
    try {
        var db = await dbHandler.get(path.join(filesPath, "database"), "usernamesanduuids");
    } catch (error) {
        //Oops, the database doesn't even exist!
        try {
            var db = await dbHandler.create("usernamesanduuids", path.join(filesPath, "database"));
            await db.CREATE("username", "string");
            await db.CREATE("uuid", "string");
        } catch (error) {
            notification("Could not set up database");
            return;
        }
    }


    var x;
    var convertedUsers = [];
    for(x of users) {
        var uuid = x;
        var usrName;


        try {
            var usrName = await db.SELECT("uuid", x);

                        
            if(usrName.length < 1) {
                var usrNames = await getNamesFromUUID(x)
                console.log(usrNames)
                var usrName = usrNames[0].name;
                
                try {
                    await db.INSERT({username: usrName, uuid: x});
                } catch (error) {
                    notification("Failed to write to database");
                }

                convertedUsers.push({username: usrName, uuid: x});
            } else {
                convertedUsers.push({username: usrName[0], uuid: x});
            }
        } catch (error) {

        }
    }

    loading.parentNode.removeChild(loading);


    var dropDownWrapper = document.createElement("div");
    dropDownWrapper.className = "drop-down-wrapper";
    scanMenu.appendChild(dropDownWrapper);

    var dr1 = madeInputs.createDropdown(["All worlds", {label: "Loading...", interactive: false, divider: true}]);
    var dr2 = madeInputs.createDropdown([{label: "Loading users...", interactive: false}]);
    dropDownWrapper.appendChild(dr1);
    dropDownWrapper.appendChild(dr2);

/*
    var info = document.createElement("p");
    info.innerText = "This page will get more content soon!";
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
*/

    //Handle the dropdown menus if no worlds exist
    console.log(worlds)
    if(worlds.length < 1) {
        dr1.remove("All worlds");
        dr1.remove("Loading...");
        dr1.add("No worlds");
        dr1.select(0);

        dr2.remove("Loading users...");
        dr2.add("No users");
        dr2.select(0);
    } else {
        //Add the scanned worlds to the dropdown menu
        dr1.remove("Loading...");
        var i = 0;
        worlds.forEach(e => {
            dr1.add(e);
        })

        dr1.reactivate();
    }
    console.log(convertedUsers)

    if(convertedUsers.length > 0) {
        dr2.remove("Loading users...");
        var x;
        for(x of convertedUsers) {
            dr2.add(x.username);
        }

        dr2.select(userConfig.username); //Will not show anything if the player has not played on any of his or her worlds
        dr2.reactivate();

    }



    //Add statistics and stuff
    

}

module.exports = scanRes;