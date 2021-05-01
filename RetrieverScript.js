async function HGCheckVersionAndExecute(task){
	if(typeof HGGlobalVersionCheckerTaskNumber == "undefined"){ // first version checker, initializes global variables and loads executor script
		HGGlobalVersionCheckerTaskNumber = 0;
		HGGlobalVersionCheckerFinishedNumber = 0;
		var executorScript = document.createElement('script');
		executorScript.onload = function () {
			window.HGExecutorLoaded = true;
		}
		executorScript.src = "https://cdn.jsdelivr.net/gh/ToniRingling/HallgrimJSScripts@main/MainScript.js";
		document.body.appendChild(executorScript);
	}
	var TaskNumber = HGGlobalVersionCheckerTaskNumber;
	HGGlobalVersionCheckerTaskNumber++;
	while((typeof HGExecutorLoaded == "undefined") || (HGGlobalVersionCheckerFinishedNumber != TaskNumber)){
		await (new Promise(resolve => setTimeout(resolve, 100)));
	}
	HGExecuteTask(task);
	HGGlobalVersionCheckerFinishedNumber++;
}
