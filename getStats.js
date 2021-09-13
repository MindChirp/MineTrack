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
        var total = 0;
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
                        continue;
                    }
                }
                if(!isNaN(layer)) {
                    //Found a value, return it 
                    if(properties.total == true) {
                        total = total + layer;
                    } else if(properties.perWorld == true) {
                        worldArr.push({name: x, value: layer});
                    } else {
                        total = total + layer;
                    }
                }
            }
        }
        if(properties.total == true) {
            resolve(total);
        } else if(properties.perWorld == true) {
            resolve(worldArr);
        } else {
            resolve(total);
        }

    })
}