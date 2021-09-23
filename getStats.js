var { dbHandler } = require("./dbModule");

function retrieveStat(statisticPath=Array, properties={total:Boolean, perWorld: Boolean}, worldPath) {
    return new Promise(async (resolve, reject)=>{
        if(statisticPath.length < 1) reject("NO PATH");
        //We get an array as the statpath

        //FORMAT: [["path", "1"], ["alternate", "path2"], ["alternate", "path3"]]
        
        //Get the minecraft worlds

        var mainPath = path.join(userConfig.minecraftpath, "saves")

        if(worldPath) {
            mainPath = worldPath;
        }


        try {
            var worlds = await fs.readdir(mainPath);
        } catch (error) {
            notification("Failed to scan minecraft saves");
            console.log(error);
        }
        //Get the username or UUID
        var x;        
        var total = [];
        var worldArr = [];

        for(x of worlds) {
            //Figure out the correct file
            var uuid = userConfig.uuid;
            var name = "";
            try {
                var files = await fs.readdir(path.join(mainPath, x, "stats"));
            } catch (error) {
                
            }
            if(files == undefined) continue;




            var y;
            for(y of files) {

                var fileName;
                //console.log(y);
                var removedJSON = y.substring(y.length - 5,0);
                if(removedJSON.length <= 16) {
                    //This is a minecraft username!
                    fileName = removedJSON;

                } else {
                    //This is an UUID, remove all the hyphens
                    fileName = removedJSON;
                    
                }


                try {
                    var stat = JSON.parse(await fs.readFile(path.join(mainPath, x, "stats", fileName + ".json")));
                } catch (error) {
                    //Could not read this config file   
                }

                



                //Test the stat for each path
                //Iterate through each path
                
                var base = stat.stats;

                var statPath;
                if(base!=undefined) {
                    statPath = base;
                } else {
                    statPath = stat;
                }
                var y;
                for(y of statisticPath) {
                    var z;
                    var layer = statPath;
                    for(z of y) {
                        try {
                            layer = layer[z];
                        } catch (error) {
                            continue; //This path didn't work, try another one
                        }
                    }
                    if(!isNaN(layer)) {
                        //Found a value, return it 
                        if(properties.total == true) {
                            //This value has a corresponding uuid / username.
                            //Find the object in the total array.
                            var obj = total.find(y => y.id === fileName);
                            
                            if(obj == undefined) {
                                
                                //Create a new object, since this object does not exist
                                var el = {
                                    id: fileName,
                                    value: layer
                                }
                                total.push(el);
                            } else {
                                obj.value = obj.value + layer;
                            }

                            
                        } else if(properties.perWorld == true) {
                            worldArr.push({name: x, value: layer});
                        } else {
                            total = total + layer;
                        }
                    }
                }


            }


            /*
                !!!!!THE CODE BELOW IS OBSOLETE!!!!!
            */
            /*
            var y;

            for(y of files) {
                if(y.replaceAll("-", "").replaceAll(".json", "") == uuid){
                    name = y.replaceAll(".json", "");
                }
            }
            try {
                
                var stat = JSON.parse(await fs.readFile(path.join(mainPath, x, "stats", name + ".json"), "utf8"));
            } catch (error) {
                try {
                    var stat = JSON.parse(await fs.readFile(path.join(mainPath, x, "stats", userConfig.username + ".json"), "utf8"));
                } catch (error) {
                    continue;
                }
            }
            */


        }
        if(properties.total == true) {
            resolve(total); //Returns ticks as timevalue
        } else if(properties.perWorld == true) {
            resolve(worldArr); //Returns array, with ticks as timevalue
        } else {
            resolve(total); //Returns ticks
        }

    })
}



function getNamesFromUUID(uuid=String) {
    return new Promise((resolve, reject)=>{
        if(typeof uuid != "string") reject(new Error("UUID required"))
        fetch("https://api.mojang.com/user/profiles/" + uuid + "/names")
        .then(res => res.json())
        .then(dat => resolve(dat))
        .catch(err=>{
            reject(err);
        })
    })
}


function replaceWithNames(list) {
    return new Promise(async (resolve, reject)=>{
        //We need to load in our database!
        try {
            var db = await dbHandler.get(path.join(filesPath, "database"), "usernamesanduuids")
        } catch (error) {
            //The database does not exist
            try {
                
                var db = await dbHandler.create("usernamesanduuids", path.join(filesPath, "database"));
                await db.CREATE("username", "string");
                await db.CREATE("uuid", "string");
            } catch (error) {
                notification("Failed to set up database");
                reject(error);
            }            
        }


        var newList = [];

        //Start checking for uuids
        var x;
        for(x of list) {
            var uuid = x.id;
            var res;
            if(uuid.toString().length <= 16) {
                try {
                    //Get the user data from the database (uuid is the minecraft username)
                    res = await db.SELECT("username", uuid);
                } catch (error) {
                    //HMMM this didn't work
                    continue;
                }

                //Check if there was a result
                if(res.length < 1) {
                    try {
                        var fetchedId = await getId(uuid);
                    } catch (error) {
                        //That's ok.                        
                    }

                    fetchedId = fetchedId==undefined?"not found":fetchedId;
                    
                    try {
                        await db.INSERT({username: uuid, uuid: fetchedId})
                    } catch (error) {
                        console.error(error);
                        continue;
                    }

                    newList.push({username: uuid, value: x.value});

                } else {
                    newList.push({username: res[0], value: x.value});
                }

            } else {

                try {
                    res = await db.SELECT("uuid", x.id);
                } catch (error) {
                    //Something went wrong
                    continue;   
                }
                //console.log(res);
                if(res.length < 1) {
                    try {
                        var usrName = await getNamesFromUUID(uuid)
                        //Get uuid from username instead!
                    } catch (error) {
                        //console.error(error);
                        continue;
                    }
                    
                    try {
                        //In this case, the uuid variable is the username!
                        await db.INSERT({username: usrName, uuid: uuid});
                    } catch (error) {
                        //console.error(error);
                        continue;
                    }
                    
                    newList.push({username: usrName, value: x.value});
                    
                    } else {
                        //the entry exists. Let's get it ans its corresponding values
                        try {
                            var vals = await db.SELECT("uuid", uuid);
                            vals = {username: vals[0], value: x.value}
                        } catch (error) {
                        //console.error(error);
                        continue;
                    }
                    
                    newList.push(vals);
                }
            }


        }

        resolve(newList);

    })
}