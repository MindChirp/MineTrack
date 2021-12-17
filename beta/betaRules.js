function getBetaRules() {
    if(userConfig.betaTester) {

        //Load in the beta stylesheet
        var link = document.createElement("link");
        link.id = "betasheet"
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", "./beta/betaStyles.css");
        document.getElementsByTagName("head")[0].appendChild(link);

        var old = document.getElementsByTagName("head")[0].querySelector("#productionsheet");
        try {
            document.getElementsByTagName("head")[0].removeChild(old);
        } catch (error) {
            //Oopsies
        }

        updateBetaFeatures();
    } else {
        var old = document.getElementsByTagName("head")[0].querySelector("#betasheet");
        try {
            document.getElementsByTagName("head")[0].removeChild(old);
        } catch (error) {
            //Oopsies
        }

        //Load in the beta stylesheet
        var link = document.createElement("link");
        link.id = "productionsheet"
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", "./css/production.css");
        document.getElementsByTagName("head")[0].appendChild(link);
    }
}


function updateBetaFeatures() {
    //Update front page stat graph
    drawSessionGraph();
    calculateSessionStats();
}

module.exports = { getBetaRules, updateBetaFeatures }