
// **Part 1: Loading the Data**

self.onmessage = function(e) {
    var data = e.data;
	console.log(data)
    var result = analyze(data);
	console.log(result)
    self.postMessage(result);
};


// Ref: https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm

function parseCSV( strData, strDelimiter ){
	strDelimiter = (strDelimiter || ",");
	var objPattern = new RegExp(
		(
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		), "gi");
	var arrData = [[]];
	var arrMatches = null;
var header = null;
	while (arrMatches = objPattern.exec( strData )){
		var strMatchedDelimiter = arrMatches[ 1 ];
		if (
			strMatchedDelimiter.length &&
			(strMatchedDelimiter != strDelimiter)
			){
			
			arrData.push( [] );
		}
		if (arrMatches[ 2 ]){
			var strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);
		} else {
			var strMatchedValue = arrMatches[ 3 ];

		}
  if (arrData.length === 1) {
	header = arrData[0];
  }
		arrData[ arrData.length - 1 ].push( strMatchedValue );
	}
var data = arrData.slice(1).map(function (row) {
  var obj = {};
  for (var i = 0; i < header.length; i++) {
	obj[header[i]] = row[i];
  }
  return obj;
});
	return( data );
}



// **Part 2: Analyzing the Data**
function analyze(data) {return data}

// let part_id
// let response;
// let response_words;
// let response_characters;
// let opinion_frames;
// let fact_frames;
// function analyze(data) {
// 	let output_array = [];
// 	for (let i = 0; i < data.length; i++) {
// 		// After getting a row, define variables for each column
// 		// part_id = data[i].part_id
// 		// console.log(part_id)
// 		console.log("Loaded:", data)
// 		response = data[i].open_response.replace(/\s+/g, ' ');
// 		response = response.replace(/\"/g, '');
// 		// response = response.replace(/\'/g, '');
// 		console.log("Response:", response)
// 		response_words = response.toString().split(' ')
//                 .map((w) => w.toLowerCase().replace(/[\W]/g, ''));




// 		// Define regular expressions
// 		const DONT_PHRASES_ARR = ["dont"," don't"," do not"," can not"," cant"," can't"];
// 		const DONT_PHRASES = DONT_PHRASES_ARR.join("|");
// 		const PRONOUNS_ARR = ["he","she","it","they"];
// 		const PRONOUNS = PRONOUNS_ARR.join("|");
// 		const PRONOUNS_REGEX = new RegExp(PRONOUNS_ARR.join("|"), 'i');
// 		const PRESIDENT_NAMES_ARR = ["candidate","clinton","donald","gop","hillary","hilary","trump","trum"];
// 		const PRESIDENT_NAMES = PRESIDENT_NAMES_ARR.join("|");
// 		const PRESIDENT_NAMES_REGEX = new RegExp(PRESIDENT_NAMES_ARR.join("|"), 'i');
// 		const SKIP_WORDS_ARR = ["also"," really"," very much"];
// 		const SKIP_WORDS = SKIP_WORDS_ARR.join("|");
// 		const AMBIGUOUS_WORDS_ARR = ["seemed","prefer"];
// 		const AMBIGUOUS_WORDS_REGEX = new RegExp(AMBIGUOUS_WORDS_ARR.join("|"), 'i');
// 		const I_OPINION_WORDS_ARR = ["agree","believe","consider","disagree","hope","feel","felt","find","oppose","think","thought","support"];
// 		const I_OPINION_WORDS = I_OPINION_WORDS_ARR.join("|");
// 		const OPINION_PHRASES_ARR = ["in my opinion","it seems to me","from my perspective","in my view","from my view","from my standpoint","for me"];
// 		const OPINION_PHRASES = OPINION_PHRASES_ARR.join("|");

// 		const OPINION_FRAME_REGEXES = [
// 		 {op_label: "op1", op_regex: new RegExp(`(?:i(?: dont| don't| do not| can not| cant| can't| also| really| very much)? (?:agree|believe|consider|disagree|hope|feel|felt|find|oppose|think|thought|support))`, 'gm')},
// 		 {op_label: "op2", op_regex: new RegExp(`(?:i'm [a-z]+ to \\b(?:agree|believe|consider|disagree|hope|feel|felt|find|oppose|think|thought|support)\\b)`, 'gm')},
// 		 {op_label: "op3", op_regex: new RegExp(`(?:in my opinion|it seems to me|from my perspective|in my view|from my view|from my standpoint|for me),? `, 'gm')}
// 		];
		  
		  
// 		const FACT_FRAME_REGEXES = [
// 		 {f_label: "fp1", f_regex: new RegExp(`(?:[tT]he [^.]*[A-Z][a-z]+ \\b(?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has)\\b)`, 'gm')},
// 		 {f_label: "fp2", f_regex: new RegExp(`(?:^[A-Z][a-z]+ (?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has))`, 'gm')},
// 		 {f_label: "fp3", f_regex: new RegExp(`(?:[tT]he [^.]*[A-Z][a-z]+?:(\'s)? [a-z]+ \\b(?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has)\\b )`, 'gm')},
// 		 {f_label: "fp4", f_regex: new RegExp(`(?:[^.]*(?:[Hh][Ee]|[Ss][Hh][Ee]|[Ii][Tt]|[Tt][Hh][Ee][Yy]) (?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would))`, 'gm')},
// 		 {f_label: "fp5", f_regex: new RegExp(`(?:^|.+\\. )(?:[Hh][Ee]|[Ss][Hh][Ee]|[Ii][Tt]|[Tt][Hh][Ee][Yy]) (?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has)`, 'gm')},
// 		 {f_label: "fp6", f_regex: new RegExp(`(?:(?:^|[^.]* )(?:[Cc][Aa]ndidate|[Cc][Ll]inton|[Dd][Oo]nald|gop|GOP|GOp|[Hh][Ii]llary|[Hh][Ii]lary|[Tt][Rr]ump|[Tt][Rr]um) (?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has))`, 'gm')},
// 		 {f_label: "fp7", f_regex: new RegExp(`(?:(?:^|[^.]* )(?:[Hh][Ee]|[Ss][Hh][Ee]|[Ii][Tt]|[Tt][Hh][Ee][Yy]|[Cc][Aa]ndidate|[Cc][Ll]inton|[Dd][Oo]nald|gop|GOP|GOp|[Hh][Ii]llary|[Hh][Ii]lary|[Tt][Rr]ump|[Tt][Rr]um) [a-z]+(?:ed|[^ia]s) )`, 'gm')},
// 		 {f_label: "fp8", f_regex: new RegExp(`(?:(?:^|[^.]* )(?:[Hh][Ee]|[Ss][Hh][Ee]|[Ii][Tt]|[Tt][Hh][Ee][Yy]|[Cc][Aa]ndidate|[Cc][Ll]inton|[Dd][Oo]nald|gop|GOP|GOp|[Hh][Ii]llary|[Hh][Ii]lary|[Tt][Rr]ump|[Tt][Rr]um) [a-z]+ [a-z]+(?:ed|[^ia]s) )`, 'gm')},
// 		 {f_label: "fp9", f_regex: new RegExp(`(?:(?:$|\\. )(?:She\'s|He\'s))`, 'g')}
// 		];




		
// 		// Check for opinion frames: loop through opinion frame regexes
// 		opinion_frames = [];
// 		console.log("Initiate Op Frames: ", JSON.parse(JSON.stringify(opinion_frames)))
// 		OPINION_FRAME_REGEXES.forEach(({ op_label, op_regex }) => {
// 			let response_lower = response.toLowerCase();
// 			let op_match = response_lower.match(op_regex);
// 			if (op_match) {
// 				op_match.forEach((match) => {
// 				opinion_frames.push({ match: match, label: op_label });
// 				});      
// 			};
// 		});
// 		// End of loop through opinion frame regexes/opinion frame check
// 		console.log("Populated Op Frames: ", JSON.parse(JSON.stringify(opinion_frames)))




// 		// Check for fact frames: loop through fact frame regexes
// 		fact_frames = [];
// 		console.log("Initiate Fact Frames: ", JSON.parse(JSON.stringify(fact_frames)))
// 		FACT_FRAME_REGEXES.forEach(({ f_label, f_regex }) => {
// 		let fact_match = response.match(f_regex);
// 			if (fact_match) {
// 				if (f_label == "fp1" || f_label == "fp2" || f_label == "fp3"){ // start:
// 				//  fp1-3 PRONOUNS/PRESIDENTS filter block
// 				console.log(fact_match)
// 					let fact_match2 = fact_match.filter((match) => {
// 						const hasPronoun = PRONOUNS_REGEX.test(match);
// 						const hasPresidentName = PRESIDENT_NAMES_REGEX.test(match);
// 						console.log(`Match: ${match}, PRONOUNS test: ${hasPronoun}, PRESIDENT_NAMES test: ${hasPresidentName}`);
// 							return (
// 							!PRONOUNS_REGEX.test(match) && !PRESIDENT_NAMES_REGEX.test(match)
// 							);
// 					}); // end: PRONOUNS/PRESIDENTS filter block, next push to array
// 				fact_match2.forEach((match) => {
// 					fact_frames.push({ match: match, label: f_label });
// 				});
// 				} else { // start: for fp4-9, push to output array (no PRONOUNS/PRESIDENTS filter)
// 					fact_match.forEach((match) => {
// 						fact_frames.push({ match: match, label: f_label });
// 					});
// 				}; // end
// 			};
// 		});
// 		// End of loop through fact frame regexes/fact frame check
// 		console.log("Populated Fact Frames: ", JSON.parse(JSON.stringify(fact_frames)))


// 		// Filter fact_frames: filter out phrases that are really op frames
// 		// by looping through op frame regexes
// 		fact_frames = fact_frames.filter((frame_i) => {
// 			const lowerCaseFrame = frame_i.match.toLowerCase();
// 			let passedOpFramesTest = opinion_frames.every(opinion => !lowerCaseFrame.includes(opinion.match))
// 			// let passedAmbigWordsTest = !AMBIGUOUS_WORDS_REGEX.test(lowerCaseFrame)
// 			return (
// 			  opinion_frames.every(opinion => !lowerCaseFrame.includes(opinion.match)) &&
// 			  !AMBIGUOUS_WORDS_REGEX.test(lowerCaseFrame)
// 			);
// 		});
// 		console.log("Op Frame Filtered Fact Frames: ", JSON.parse(JSON.stringify(fact_frames)))


// 		// const result = {};
// 		// result.part_id = part_id
// 		// result.opinion_frames_t2 = opinion_frames.length
// 		// result.fact_frames_t2 = fact_frames.length
// 		// result.net_score = opinion_frames_t2 - fact_frames_t2
		
// 		let opinion_frames_t2 = opinion_frames.length
// 		let fact_frames_t2 = fact_frames.length
// 		let net_score = opinion_frames_t2 - fact_frames_t2
		
		

// 		const result = {
// 			part_id: part_id,
// 			input: response,
// 			net_score: net_score,
// 			opinion_frames_t2: opinion_frames_t2,
// 			fact_frames_t2: fact_frames_t2,
// 			opinion_frames: opinion_frames.map(obj => JSON.stringify(obj)).join(", "),
// 			fact_frames: fact_frames.map(obj => JSON.stringify(obj)).join(", ")
// 		  };
// 		  console.log("Result: ", JSON.parse(JSON.stringify(result)))

// 		// Display result in html
// 		// const output = document.getElementById('output');
// 		// output.textContent = `Net score: ${net_score}\nOpinion frames: ${opinion_frames_t2}\nFact frames: ${fact_frames_t2}`;


// 		// Push to output array
// 		output_array.push(result);

// 	};
// 	// End of loop for row i


// 	//Make csv output
// 	// let path = require('path');
// 	// let scriptName = path.basename(process.argv[1]); // get the file name from the full path
// 	// let csvFileName = scriptName.replace('output',path.extname(scriptName), '.csv'); // replace the extension with .csv
// 	function formatCSVString(str) {
// 		if (typeof str === 'string') {
// 			return `"${str.replace(/"/g, '""')}"`; // Replace any double quotes with two double quotes and wrap in double quotes
// 		} else {
// 			return str;
// 		}
// 	}
// 	// let csvFileName = "output3.5_nosent3.5_5_12.csv"
// 	// let csvContent = Object.keys(output_array[0]).map(formatCSVString).join(',') + '\n'; // make header
// 	// output_array.forEach(item => {
// 	// 	csvContent += Object.values(item).map(formatCSVString).join(',') + '\n';
// 	// });
// 	// let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
// 	// let url = URL.createObjectURL(blob);
// 	// let link = document.createElement('a');
// 	// link.setAttribute('href', url);
// 	// link.setAttribute('download', csvFileName); // use csvFileName here
// 	// link.style.visibility = 'hidden';
// 	// document.body.appendChild(link);
// 	// link.click();
// 	// document.body.removeChild(link);
	
// return output_array
// };
// // End of analyze() function call

