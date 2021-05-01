function HGCheckVersionAndExecute(task){
	// Note that the executor script should always be loaded after all tasks with this construction. As such all tasks should be pushed onto the list before it is loaded.
	if(typeof HGTaskList == "undefined"){ // first version checker, load the executor script
		window.HGTaskList = [];
		var executorScript = document.createElement('script');
		executorScript.onload = function () {
			for(var a = 0; a < HGTaskList.length; a++){
				HGExecuteTask(HGTaskList[a]);
			}
		};
		executorScript.src = "https://cdn.jsdelivr.net/gh/ToniRingling/HallgrimJSScripts@main/MainScript.js";
		document.body.appendChild(executorScript);
	}
	HGTaskList.push(task);
}