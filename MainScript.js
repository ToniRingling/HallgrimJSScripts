function HGExecuteTask(taskCode){
	eval(`;(function(){
		
		window.onerror = function(ms, src, line, col, er){
		  console.log(er);
		  if(er instanceof SyntaxError){
			alert("A syntax error was detected. The task likely failed catastrophically. The error is:\\n" + er.message);
		  }
		}
		
		HGRegularInstance = 0; // the HGInstance numbers to be expected in the respective types of instances, for use in scripts to distinguish both
		HGFeedbackInstance = 1;

		// global marker for being in an exam review

		if(typeof HGIsExamReviewGlobal == 'undefined'){
		  HGIsExamReviewGlobal = true; // assumed to be true, if false found when scanning the output gaps
		}

		// global counter for instances, used whenever multiple tasks are on one page (feedback, exams)
		if(typeof HGInstanceGlobal == 'undefined'){ // check for global outside instance counter
		  HGInstanceGlobal = 0; // first instance, set number to 0
		}
		var HGInstance = HGInstanceGlobal;
		
		console.log("EXECUTE INSTANCE " + HGInstance);

		HGInstanceGlobal = HGInstanceGlobal + 1;

		function HGGapStandardSetter(element){ // for answer-gaps
		  var elementCopy = element;
		  var setter = function(value){
			elementCopy.value = HGToB64(value);
		  }
		  return setter;
		}


		function HGGapStandardGetter(element){ // for answer-gaps
		  var elementCopy = element;
		  var getter = function(){
			return HGFromB64(elementCopy.value);
		  }
		  return getter;
		}

		function HGSBoxStandardGetter(element){ // for solution-boxes
		  var elementCopy = element;
		  var getter = function(){
			try{
			  var out = HGFromB64(elementCopy.innerText);
			  return out;
			}
			catch(e){ // ILIAS inserts some whitespace when there is no answer, which causes HGFromB64 to fail
			  return "";
			}
		  }
		  return getter;
		}


		var taskTop = document.querySelectorAll("[HGTopMarker = 'Mark']")[0];
		taskTop.setAttribute('HGTopMarker', 'Used');
		var taskTopIndex = [].slice.call(taskTop.parentNode.children).indexOf(taskTop);
		var gaps = taskTop.parentNode.children[taskTopIndex - 1].children; // the question gaps are right above the HGTopMarker element

		var gapIDs = [];
		if(gaps[1].nodeName == "IMG"){ // when correcting, only half the elements in "gaps" are real gaps, the others are icons
			for(var a = 0; a < (gaps.length / 2) - 4; a++){
				gapIDs.push("answer" + a);
			}
		}
		else{
			for(var a = 0; a < gaps.length - 4; a++){
				gapIDs.push("answer" + a);
			}
		}
		gapIDs.push("raw");
		gapIDs.push("comments");
		gapIDs.push("meta");
		gapIDs.push("misc");

		if(document.getElementsByName("gap_0")[0]){ // check if currently answering
		  HGMode = "ANSWERING"; // global variable for current question environment
		  HGIsExamReviewGlobal = false;
		  for (gapNum = 0; gapNum < gaps.length; gapNum++){
			var element = gaps[gapNum];
			element.type = "hidden"; // if so, hide answer and other fields
			element.setAttribute("HGOutput", gapIDs[gapNum]);
			element.setAttribute("HGNumber", HGInstance);
			element.HGGetter = HGGapStandardGetter(element);
			element.HGSetter = HGGapStandardSetter(element);
		  }
		  if(document.getElementsByName("gap_" + (gaps.length - 4))[0].value != ""){ // if there is already some raw input
			HGMode = "CONTINUING"; // global variable for current question environment
		  }
		}
		else if(document.getElementsByClassName("ilc_qinput_TextInput solutionbox")[0]){ // check if currently correcting
		  HGMode = "CORRECTING"; // global variable for current question environment
		  var gapMultiplier = 1;
		  if(gaps[1].nodeName == "IMG"){ // with checkmarks/crosses
			gapMultiplier = 2;
			console.log("Gap contents (Troubleshooting information):"); // farther down gap contents are printed to console
			if(HGInstance == 0){
			  HGIsExamReviewGlobal = false; // when viewing exams this has no checksmarks/crosses, else it does, as it will be the upper part when viewing results
			}
		  }
		  for (gapNum = 0; gapNum < gaps.length; gapNum++){
			gaps[gapNum].setAttribute("hidden", true); // hide all the answer fields (helped troubleshooting, but sometimes caused a bizarre rendering bug in firefox)
		  }
		  for (gapNum = 0; gapNum * gapMultiplier < gaps.length; gapNum++){
			var element = gaps[gapNum * gapMultiplier];
			element.setAttribute("HGOutput", gapIDs[gapNum]);
			element.setAttribute("HGNumber", HGInstance);
			element.HGGetter = HGSBoxStandardGetter(element);
			element.HGSetter = function(arg){}; // no changing of solutions
			if(gapMultiplier == 2){
			  console.log(gapIDs[gapNum] + ":");
			  console.log(element.HGGetter());
			}
		  }
		}
	
		HGErrorMessages = [];

		function HGCompEnc(inp){
			inp = inp.replace(/</g,"&lt;");
			inp = inp.replace(/>/g,"&gt;");
			return inp;
		}

		function HGCleaner(inp){
			DOMPurify.sanitize(inp);
		}

		function HGInput(inputID){
		  var result = document.querySelectorAll("[HGInput = " + inputID + "][HGNumber = '" + HGInstance + "']")[0];
		  if(typeof result == 'undefined'){ // for compatibility with old tasks
			result = document.querySelectorAll("[HGInput = " + inputID + "]")[0];
		  }
		  return result;
		}

		function HGRegisterInput(element, HGID){
		  element.setAttribute("HGInput", HGID);
		  element.setAttribute("HGNumber", HGInstance);
		}

		function HGOutput(outputID){
		  if(outputID == "answer"){
			  outputID = "answer0";
		  }
		  return document.querySelectorAll("[HGOutput = " + outputID + "][HGNumber = '" + HGInstance + "']")[0];
		}

		function HGUtility(utilityID){ // this is for anything that isn't input or output
		  return document.querySelectorAll("[HGUtility = " + utilityID + "][HGNumber = '" + HGInstance + "']")[0];
		}

		function HGRegisterUtility(element, HGID){
		  element.setAttribute("HGUtility", HGID);
		  element.setAttribute("HGNumber", HGInstance);
		}

		function HGInputs(inputID){
		  return document.querySelectorAll("[HGInput = " + inputID + "]");
		}

		function HGUtilities(utilityID){ // this is for anything that isn't input or output
		  return document.querySelectorAll("[HGUtility = " + utilityID + "]");
		}

		function HGSaveInputs(){
		  var aggregate = {};
		  var inputs = document.querySelectorAll("[HGInput]") // get all inputs
		  for (var InpNum = 0; InpNum < inputs.length; InpNum++){
			if((typeof inputs[InpNum].HGNumber == 'undefined') || (inputs[inpNum].HGNumber == HGInstance)){ // backwards compatibility for cases with no HGNumber
			  var ID = inputs[InpNum].getAttribute("HGInput");
			  aggregate[ID] = inputs[InpNum].HGGetter();
			}
		  }
		  HGOutput("raw").HGSetter(JSON.stringify(aggregate)); // save results to output for raw inputs
		}

		function HGLoadInputs(){
		  if(HGOutput("raw").HGGetter() != "raw"){
			try{
			  var aggregate = JSON.parse(HGOutput("raw").HGGetter());
			  for (const [id, content] of Object.entries(aggregate)){
				HGInput(id).HGSetter(content); // redirect content to appropriate input
			  }
			}
			catch(err){
			  console.log("HallgrimJS: loading inputs failed - " + err.message)
			}
		  }
		}

		function HGSaveMeta(){
		  HGOutput("meta").HGSetter(JSON.stringify(HGMetaData));
		}

		function HGLoadMeta(){
		  if(HGOutput("meta").HGGetter() != "meta"){
			try{
			  HGMetaData = JSON.parse(HGOutput("meta").HGGetter());
			  HGRandomSeed = HGMetaData["RandomSeed"]; // be sure to set loaded random seed
			}
			catch(err){
			  console.log("HallgrimJS: loading metadata failed - " + err.message)
			}
		  }
		}

		function HGSaveAll(){
		  HGSaveInputs();
		  HGSaveMeta();
		}

		function HGLoadAll(){
		  HGLoadInputs();
		  HGLoadMeta();
		}

		HGAutoEvaluate = false;

		function HGEnableAutoEvaluation(){
		  HGAutoEvaluate = true;
		}

		function HGSaveToServer(){
		  if(HGAutoEvaluate){
			HGEvaluate();
		  }
		  try{
			var getQParFromURL = function(par, url){
			  var reg = new RegExp('(&|\\\\?)' + par + '=[^&]*');
			  return (reg.exec(url)[0]).slice(par.length+2)
			}
			var data = $('#taForm').serialize();
			var url = window.location.href;
			var refId = getQParFromURL('ref_id', url);
			var qId = getQParFromURL('q_id', url);
			var actId = getQParFromURL('active_id', url);
			var cmdNode = getQParFromURL('cmdNode', url);
			url = "ilias.php?ref_id=" + refId + "&test_express_mode=1&q_id=" + qId + "&sequence=1&active_id=" + actId + "&pmode=edit&cmd=autosave&cmdClass=iltestplayerfixedquestionsetgui&cmdNode=" + cmdNode + "&baseClass=ilrepositorygui&cmdMode=asynch&test_answer_changed=1"
			var ef = function(a,b,c){console.log("HallgrimJS: saving to server failed - " + a + "/" + b + "/" + c);}
			$.ajax({
			  type: 'POST',
			  url: url,
			  data: data,
			  dataType: 'text',
			  timeout: 10000,
			})
			.fail(ef);
			return true;
		  }
		  catch(err){
			console.log("HallgrimJS: saving to server failed - " + err.msg);
			return false;
		  }
		}

		HGAutoSaveDisabled = false;

		function HGDisableAutoSave(){
		  HGAutoSaveDisabled = true;
		}

		async function HGAutoSave(period){ // automatically saves every 'period' seconds
		  while(true){
			await (new Promise(resolve => setTimeout(resolve, period)));
			if(HGAutoSaveDisabled){
			  break;
			}
			HGSaveAll();
			HGSaveToServer();
		  }
		}

		function HGFinish(){ // saves values and calls evaluator, should be called when finishing tasks (navigate elsewhere, time runs out etc.)
		  HGSaveAll();
		  HGEvaluate();
		}

		if(typeof HGFinishersGlobal == 'undefined'){ // check for global finisher container
		  HGFinishersGlobal = []; // first instance, set to empty list
		}

		HGFinishersGlobal.push(function(finisher){return function(){finisher();};}(HGFinish));

		function HGFinishAll(){
		  for(var a = 0; a < HGFinishersGlobal.length; a++){
			HGFinishersGlobal[a]();
		  }
		}

		async function HGTimeEnder(){ // inserted before the script which closes the task after the time runs out, saves and evaluates before closing
		  HGFinishAll();
		  await (new Promise(resolve => setTimeout(resolve, 200))); // else value sometimes not saved
		  il.TestPlayerQuestionEditControl.saveOnTimeReached();
		}

		function HGTimeEndReplacer(){ // replaces the ending function for when time runs out by HGTimeEnder
			try{
				if(typeof setWorkingTime != 'undefined'){ // check if there is a time limit
					setWorkingTimeRenewer = new Function(setWorkingTime.toString().replace(/il.TestPlayerQuestionEditControl.saveOnTimeReached\(\)/g,"HGTimeEnder()") + "return setWorkingTime;") // new function
					setWorkingTime = setWorkingTimeRenewer(); // replace old one
				}
			}
			catch(e){
				HGErrorMessages.push("Error in replacement of time restriction management:" + e.message);
			}
		}

		async function HGSaveAndClick(toClick){ // to be put on a replacement button for an old navigation button, saves and evaluates answers before clicking old button
		  HGFinishAll();
		  HGRealButtons[toClick].click();
		}

		if(typeof HGNavButtonsReplaced == 'undefined'){
			HGNavButtonsReplaced = false;
		}

		async function HGNavButtonReplacer(){ // hides all navigation buttons and replaces them with new buttons which save and evaluate answers before doing the same thing
			if(!HGNavButtonsReplaced){ // I think there is a really small chance for a race condition here, but that should be really unlikely
				HGNavButtonsReplaced = true;
				if(!((HGMode == "ANSWERING") || (HGMode == "CONTINUING"))){
					return; // in other cases buttons are not replaced
				}
				try{
					HGRealButtons = [];
					var links = Array.prototype.slice.call(document.links); // links, converted to array to prevent replacing the replacements etc. for infinite looping
					links = links.concat(Array.from(document.querySelectorAll("[class*='btn-default']"))); // other relevant navigation buttons
					links = Array.from(new Set(links)); // make sure entries are unique
					var fakedNum = 0;
					for (var linkNum = 0; linkNum < links.length; linkNum++){
						var linkClass = links[linkNum].getAttribute("class");
						var fakeInner = "";
						if(linkClass == null){ // plain link
							fakeInner='<a onclick="HGSaveAndClick(' + fakedNum + ');" href="#">' + links[linkNum].innerHTML + '</a>';
							if(links[linkNum].parentElement.getAttribute("role") == "tab"){ // these only exist within the administration-context (riders for preview, editing page etc.)
								fakeInner = "";
							}
						}
						else if((linkClass.search("btn-default") != -1) && (links[linkNum].innerHTML != "Frage entfernen")){ // regular navigation button, we sort out question removal buttons because they are in edit mode, and so don't need saving of answers, and we don't wan't these to be blocked by a faulty evaluator under any circumstances, so the test the question is in does not have to be deleted to remove it
							var shownText = "";
							if(links[linkNum].getAttribute("value") != null){ // buttons which look the same may be built in different ways
								shownText = links[linkNum].getAttribute("value");
							}
							else{
								shownText = links[linkNum].innerHTML;
							}
							fakeInner='<button  type="button" onclick="HGSaveAndClick(' + fakedNum + ');"  class="' + links[linkNum].getAttribute("class") + '">' + shownText + '</button>';
						}
						if(fakeInner != ""){
							links[linkNum].style.display = "none"; // hide old button
							HGRealButtons[fakedNum] = links[linkNum]; // put old button into HGRealButtons list
							var fakeButton = document.createElement("NewLinkButton" + fakedNum); // make new fake button
							fakeButton.innerHTML = fakeInner;
							links[linkNum].parentNode.appendChild(fakeButton); // put fake button into same position as old button
							fakedNum += 1;
						}
					}
				}
				catch(e){
					HGErrorMessages.push("Error in navigation button replacement:" + e.message);
				}
				document.addEventListener('DOMContentLoaded', (event) => {
						if(document.getElementById("bottomnextbutton") != "undefined"){
							document.getElementById("bottomnextbutton").style.display = "none";;
						}
					}
				)
			}
		}

		function HGEvaluate(){
		  return HGEvaluator();
		}

		function HGRegisterEvaluator(evaluator){
		  HGEvaluator = function(evaluatorCl){return function(){evaluator();}}(evaluator);
		}

		var BestSolutionSeenString = "HallgrimJS: Die Musterlösung wurde angesehen."

		function HGBlockingEvaluator(){
		  var ansNum = 0;
		  while(HGOutput('answer' + ansNum) != undefined){
			HGOutput('answer' + ansNum).HGSetter(BestSolutionSeenString);
			ansNum += 1;
		  }
		}

		function HGElement(inp){
			return document.getElementById(inp);
		}

		function HGElements(inp){
			return document.querySelectorAll("[HGID = '" + inp + "']");
		}

		if(typeof HGUsedElements == 'undefined'){ // the HGIDs will be replaced in order, so we can count through them for duplicates
		  HGUsedElements = {};
		}

		function HGNextElement(inp){
		  if(!HGUsedElements[inp]){
			HGUsedElements[inp] = 0;
		  }
		  HGUsedElements[inp] += 1;
		  return document.querySelectorAll("[HGID = '" + inp + "']")[HGUsedElements[inp] - 1];
		}

		function HGToB64(inp) {
		 return btoa(unescape(encodeURIComponent(inp)));
		}

		function HGFromB64(inp) {
		 return decodeURIComponent(escape(atob(inp)));
		}

		function HGRand(){
		  HGRandomSeed = (((2 ** 31) - 1) & (Math.imul(13466917, HGRandomSeed))); // 32-bit linear congruence generator, do not use for any cryptographic purposes
		  return HGRandomSeed;
		}

		function HGSRand(seed){
		  HGMetaData["RandomSeed"] = seed;
		  HGRandomSeed = seed;
		}

		function HGGlobalize(toGlobalize, name){ // push variable out into global context under the given name
		  // should you ever want to try and make a version which maintains the same name it cant be a normal javaScript function, as the passing changes the name
		  var closer = function(glob){var inside = glob; return inside;}
		  window[name] = closer(toGlobalize);
		}

		function HGPeephole(){ // get a way to eval something inside the context of the task, used for debugging
		  console.log(function(){return function(code){eval(code)}}());
		}

		function HGPeepHole(){ // alias
		  HGPeephole();
		}
		
		var HGFeedbackMap = {};
		var HGFeedbackOnlyList = {};
		
		function HGShowFeedback(){
		  var inputs = document.querySelectorAll("[HGInput]") // get all inputs
		  for (var InpNum = 0; InpNum < inputs.length; InpNum++){
			if((inputs[InpNum].HGNumber == HGInstance) && (typeof HGFeedbackMap[inputs[InpNum].getAttribute("HGInput")] != "undefined")){ // if feedback exists, set content to feedback
			  inputs[InpNum].HGSetter(HGFeedbackMap[inputs[InpNum].getAttribute("HGInput")] );
			}
		  }
		  for (var FBONum = 0; FBONum < HGFeedbackOnlyList.length; FBONum++){ // go through feedback-only-parts and display them
			HGFeedbackOnlyList[FBONum].removeAttribute("hidden");
		  }
		}

		HGLoaded = false; 
		HGLoadHandler = function(){}; // may be replaced by user code to be called upon loading

		function HGPrepLoad(){ // loads values after user code runs, calls load handler at end
			if(!HGLoaded){
				HGLoaded = true;
				HGLoadAll();
				if(HGMetaData["viewedSolution"] == "yes"){ // caused by using a feedbackButton
					HGRegisterEvaluator(blockEval);
				}
				HGLoadHandler();
				if(HGInstance == HGFeedbackInstance && !HGIsExamReviewGlobal && HGMode == "CORRECTING"){
					HGShowFeedback();
				}
				if(HGInstance == HGFeedbackInstance && !HGIsExamReviewGlobal && HGOutput("answer").HGGetter() == BestSolutionSeenString){ // checking for feedback instance already ensures we are correcting
					alert("Die Musterlösung für diese Aufgabe wurden angesehen!");
				}
			}
		}

		function HGRegisterLoadingHandler(handler){ // sets new load handler (see HGPrepLoad)
			HGLoadHandler = handler;
		}

		var HGRandomSeed = 0;
		var HGMetaData = {};

		function HGPrep(){
			HGRegisterEvaluator(function(){HGOutput('answer').HGSetter(HGOutput('raw').HGGetter());});
			if(typeof(HGPrepPass) == "undefined"){HGPrepPass = 0;} //temporary solution for solving the second round of preparations when correcting}
			if(HGMode == "ANSWERING"){
				HGSRand((new Date).getTime());
				HGAutoSave(30000);
				HGTimeEndReplacer();
				HGLoaded = true; // no loading needed
			}
			else if(HGMode == "CONTINUING"){
				HGAutoSave(30000);
				HGTimeEndReplacer();
			}
			else if(HGMode == "CORRECTING"){
				if(HGPrepPass == 0){
					HGLoaded = false; // load on second pass only (done so the loading handler is only called once)
				}
			}
			HGPrepPass += 1;
		}

		HGPrep();
		` + taskCode + `
		HGPrepLoad();
		HGNavButtonReplacer();
	}).call(this)`)
}
