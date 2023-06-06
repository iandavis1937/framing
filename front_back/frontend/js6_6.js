const fs = require('fs').promises;
const Papa = require('papaparse');

const history = [];


function parseCSV(data, delimiter) {
    let parsedData = Papa.parse(data, { delimiter: delimiter, header: true }).data;
	return parsedData.filter(row => row['open_response'] !== 'NA');
}

// // Ref: https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm

//   async function parseCSV( strData, strDelimiter ){
// 		strDelimiter = (strDelimiter || ",");
// 		var objPattern = new RegExp(
// 			(
// 				"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
// 				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
// 				"([^\"\\" + strDelimiter + "\\r\\n]*))"
// 			), "gi");
// 		var arrData = [[]];
// 		var arrMatches = null;
//     var header = null;
// 		while (arrMatches = objPattern.exec( strData )){
// 			var strMatchedDelimiter = arrMatches[ 1 ];
// 			if (
// 				strMatchedDelimiter.length &&
// 				(strMatchedDelimiter != strDelimiter)
// 				){
				
// 				arrData.push( [] );
// 			}
// 			if (arrMatches[ 2 ]){
// 				var strMatchedValue = arrMatches[ 2 ].replace(
// 					new RegExp( "\"\"", "g" ),
// 					"\""
// 					);
// 			} else {
// 				var strMatchedValue = arrMatches[ 3 ];

// 			}
//       if (arrData.length === 1) {
//         header = arrData[0];
//       }
// 			arrData[ arrData.length - 1 ].push( strMatchedValue );
// 		}
//     var data = arrData.slice(1).map(function (row) {
//       var obj = {};
//       for (var i = 0; i < header.length; i++) {
//         obj[header[i]] = row[i];
//       }
//       return obj;
//     });
// 		return( data );
// 	}

// Import necessary modules
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

// Create an Express application
const app = express();

// Use body-parser middleware to parse incoming JSON requests
app.use(bodyParser.json());

  
input = "./study2.csv"

let participant_result = [];
let flask_output_arr = [];
async function getData(input) {
	return fs.readFile(input, 'utf8')
		.then(async csvText => {
			const fileData_raw = parseCSV(csvText, ",");
			console.log("Header: ", fileData_raw[1])
			for (const open_response of fileData_raw) {
				try {
					console.log("Sending data to Flask endpoint...");
					const flask_output = await axios.post('http://127.0.0.1:5000/flask_output', open_response);
					console.log("Received response from Flask:", flask_output.data);
					// Push the data into flask_outputs array
					flask_output_arr.push(flask_output.data);
				} catch (err) {
					console.error(err); // or do something more sophisticated with the error
				}
			}
			return flask_output_arr; // return the flask_outputs array
		});
}

				
/*
// // Define the POST route for "/node_to_flask"
// app.post('/node_to_flask', async (req, res) => {
	// console.log("Req Headers: ", req.headers);
	// Log the data
		// console.log(`Data received: ${req.body}`);
		// for (let key in req.body) {
		// 	console.log(`${key}: ${req.body[key]}`);
		// 	}
		for (let key in flask_output) {
				console.log(`${key}: ${flask_output[key]}`);
		}
		// flask_output.forEach((response, index) => {
			let flask_status = flask_output.data.status
			// let flask_message = flask_output.data.message
			let part_id = flask_output.data.part_id;
			let response_str = flask_output.data.clauses_text;	     										            	   	       		// let flask_message = req.body.messasge
			console.log("Status: ", flask_status, "Response String: ", response_str)
			console.log(typeof response_str);
*/
			

// **Part 2: Analyzing the Clauses from Flask**
// Process data and generate a result
async function analyze(flask_output_arr) {
	flask_output_arr.forEach((flask_output_row) => {
	let part_id = flask_output_row.part_id;
	participant_result.part_id = part_id
	participant_result.input = ''
	participant_result.net_score = 0
	participant_result.opinion_frames = []
	participant_result.opinion_frames_t2 = 0
	participant_result.fact_frames = []
	participant_result.fact_frames_t2 = 0
	let response;
	let response_words;
	let opinion_frames;
	let fact_frames;
	let response_str = flask_output_row.clauses_text;
	let response_arr = response_str.split('][');
	console.log("Response Array: ", response_arr);
	response_arr.forEach((response, index) => {
			console.log("Response", index, response, typeof response)
			response = response.replace(/\s+/g, ' ');
			response = response.replace(/\"/g, '');
			// response = response.replace(/\'/g, '');
			console.log(response)
			response_words = response.toString().split(' ')
					.map((w) => w.toLowerCase().replace(/[\W]/g, ''));
	
			// Define regular expressions
			const DONT_PHRASES_ARR = ["dont"," don't"," do not"," can not"," cant"," can't"];
			const DONT_PHRASES = DONT_PHRASES_ARR.join("|");
			const PRONOUNS_ARR = ["he","she","it","they"];
			const PRONOUNS = PRONOUNS_ARR.join("|");
			const PRONOUNS_REGEX = new RegExp(PRONOUNS_ARR.join("|"), 'i');
			const PRESIDENT_NAMES_ARR = ["candidate","clinton","donald","gop","hillary","hilary","trump","trum"];
			const PRESIDENT_NAMES = PRESIDENT_NAMES_ARR.join("|");
			const PRESIDENT_NAMES_REGEX = new RegExp(PRESIDENT_NAMES_ARR.join("|"), 'i');
			const SKIP_WORDS_ARR = ["also"," really"," very much"];
			const SKIP_WORDS = SKIP_WORDS_ARR.join("|");
			const AMBIGUOUS_WORDS_ARR = ["seemed","prefer"];
			const AMBIGUOUS_WORDS_REGEX = new RegExp(AMBIGUOUS_WORDS_ARR.join("|"), 'i');
			const I_OPINION_WORDS_ARR = ["agree","believe","consider","disagree","hope","feel","felt","find","oppose","think","thought","support"];
			const I_OPINION_WORDS = I_OPINION_WORDS_ARR.join("|");
			const OPINION_PHRASES_ARR = ["in my opinion","it seems to me","from my perspective","in my view","from my view","from my standpoint","for me"];
			const OPINION_PHRASES = OPINION_PHRASES_ARR.join("|");
	
			const OPINION_FRAME_REGEXES = [
				{op_label: "op1", op_regex: new RegExp(`(?:i(?: dont| don't| do not| can not| cant| can't| also| really| very much)? (?:agree|believe|consider|disagree|hope|feel|felt|find|oppose|think|thought|support))`, 'gm')},
				{op_label: "op2", op_regex: new RegExp(`(?:i'm [a-z]+ to \\b(?:agree|believe|consider|disagree|hope|feel|felt|find|oppose|think|thought|support)\\b)`, 'gm')},
				{op_label: "op3", op_regex: new RegExp(`(?:in my opinion|it seems to me|from my perspective|in my view|from my view|from my standpoint|for me),? `, 'gm')}
			];
				
				
			const FACT_FRAME_REGEXES = [
				{f_label: "fp1", f_regex: new RegExp(`(?:[tT]he [^.]*[A-Z][a-z]+ \\b(?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has)\\b)`, 'gm')},
				{f_label: "fp2", f_regex: new RegExp(`(?:^[[A-Z][a-z]+|[a-z]+] (?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has))`, 'gm')},
				{f_label: "fp3", f_regex: new RegExp(`(?:[tT]he [^.]*[A-Z][a-z]+?:(\'s)? [a-z]+ \\b(?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has)\\b )`, 'gm')},
				{f_label: "fp4", f_regex: new RegExp(`(?:[^.]*(?:[Hh][Ee]|[Ss][Hh][Ee]|[Ii][Tt]|[Tt][Hh][Ee][Yy]) (?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would))`, 'gm')},
				{f_label: "fp5", f_regex: new RegExp(`(?:^|.+\\. )(?:[Hh][Ee]|[Ss][Hh][Ee]|[Ii][Tt]|[Tt][Hh][Ee][Yy]) (?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has)`, 'gm')},
				{f_label: "fp6", f_regex: new RegExp(`(?:(?:^|[^.]* )(?:[Cc][Aa]ndidate|[Cc][Ll]inton|[Dd][Oo]nald|gop|GOP|GOp|[Hh][Ii]llary|[Hh][Ii]lary|[Tt][Rr]ump|[Tt][Rr]um) (?:are|can't|demonstrate|demonstrates|did|had|is|needs|should|will|would|were|was|has))`, 'gm')},
				{f_label: "fp7", f_regex: new RegExp(`(?:(?:^|[^.]* )(?:[Hh][Ee]|[Ss][Hh][Ee]|[Ii][Tt]|[Tt][Hh][Ee][Yy]|[Cc][Aa]ndidate|[Cc][Ll]inton|[Dd][Oo]nald|gop|GOP|GOp|[Hh][Ii]llary|[Hh][Ii]lary|[Tt][Rr]ump|[Tt][Rr]um) [a-z]+(?:ed|[^ia]s) )`, 'gm')},
				{f_label: "fp8", f_regex: new RegExp(`(?:(?:^|[^.]* )(?:[Hh][Ee]|[Ss][Hh][Ee]|[Ii][Tt]|[Tt][Hh][Ee][Yy]|[Cc][Aa]ndidate|[Cc][Ll]inton|[Dd][Oo]nald|gop|GOP|GOp|[Hh][Ii]llary|[Hh][Ii]lary|[Tt][Rr]ump|[Tt][Rr]um) [a-z]+ [a-z]+(?:ed|[^ia]s) )`, 'gm')},
				{f_label: "fp9", f_regex: new RegExp(`(?:(?:$|\\. )(?:She\'s|He\'s))`, 'g')}
			];
	
			
			// Check for opinion frames: loop through opinion frame regexes
			opinion_frames = [];
			console.log("Initiate Op Frames: ", JSON.parse(JSON.stringify(opinion_frames)))
			OPINION_FRAME_REGEXES.forEach(({ op_label, op_regex }) => {
				let response_lower = response.toLowerCase();
				// console.log(response_lower)
				let op_match = response_lower.match(op_regex);
				if (op_match) {
					console.log(op_match)
					op_match.forEach((match) => {
					opinion_frames.push({ match: match, label: op_label });
					});      
				};
			});
			// End of loop through opinion frame regexes/opinion frame check
			console.log("Populated Op Frames: ", JSON.parse(JSON.stringify(opinion_frames)))
	
	
			// Check for fact frames: loop through fact frame regexes
			fact_frames = [];
			console.log("Initiate Fact Frames: ", JSON.parse(JSON.stringify(fact_frames)))
			FACT_FRAME_REGEXES.forEach(({ f_label, f_regex }) => {
			let fact_match = response.match(f_regex);
				if (fact_match) {
					if (f_label == "fp1" || f_label == "fp2" || f_label == "fp3"){ // start:
					//  fp1-3 PRONOUNS/PRESIDENTS filter block
					// console.log(fact_match)
						let fact_match2 = fact_match.filter((match) => {
							const hasPronoun = PRONOUNS_REGEX.test(match);
							const hasPresidentName = PRESIDENT_NAMES_REGEX.test(match);
							console.log(`Match: ${match}, PRONOUNS test: ${hasPronoun}, PRESIDENT_NAMES test: ${hasPresidentName}`);
								return (
								!PRONOUNS_REGEX.test(match) && !PRESIDENT_NAMES_REGEX.test(match)
								);
						}); // end: PRONOUNS/PRESIDENTS filter block, next push to array
					fact_match2.forEach((match) => {
						fact_frames.push({ match: match, label: f_label });
					});
					} else { // start: for fp4-9, push to output array (no PRONOUNS/PRESIDENTS filter)
						fact_match.forEach((match) => {
							fact_frames.push({ match: match, label: f_label });
						});
					}; // end
				};
			});
			// End of loop through fact frame regexes/fact frame check
			console.log("Populated Fact Frames: ", JSON.parse(JSON.stringify(fact_frames)))
	
	
			// Filter fact_frames: filter out phrases that are really op frames
			// by looping through op frame regexes
			fact_frames = fact_frames.filter((frame_i) => {
				const lowerCaseFrame = frame_i.match.toLowerCase();
				let passedOpFramesTest = opinion_frames.every(opinion => !lowerCaseFrame.includes(opinion.match))
				// let passedAmbigWordsTest = !AMBIGUOUS_WORDS_REGEX.test(lowerCaseFrame)
				return (
					opinion_frames.every(opinion => !lowerCaseFrame.includes(opinion.match)) &&
					!AMBIGUOUS_WORDS_REGEX.test(lowerCaseFrame)
				);
			});
			console.log("Op Frame Filtered Fact Frames: ", JSON.parse(JSON.stringify(fact_frames)))
				
	
			// const clause_result = {};
			// clause_result.part_id = part_id
			// clause_result.opinion_frames_t2 = opinion_frames.length
			// clause_result.fact_frames_t2 = fact_frames.length
			// clause_result.net_score = opinion_frames_t2 - fact_frames_t2
			
			let opinion_frames_t2 = opinion_frames.length
			let fact_frames_t2 = fact_frames.length
			let net_score = opinion_frames_t2 - fact_frames_t2
			
			
	
			const clause_result = {
				part_id: part_id,
				input: response,
				net_score: net_score,
				opinion_frames_t2: opinion_frames_t2,
				fact_frames_t2: fact_frames_t2,
				opinion_frames: opinion_frames.map(obj => JSON.stringify(obj)).join(", "),
				fact_frames: fact_frames.map(obj => JSON.stringify(obj)).join(", ")
				};
			// console.log("Clause Result: ", JSON.parse(JSON.stringify(clause_result)))

			//Update participant_result directly here
			participant_result.input += '__' + clause_result.input;
			participant_result.net_score += clause_result.net_score;
			if(clause_result.opinion_frames) { 
				participant_result.opinion_frames.push(clause_result.opinion_frames);
			}
			participant_result.opinion_frames_t2 += clause_result.opinion_frames_t2;
			if(clause_result.fact_frames) { 
				participant_result.fact_frames.push(clause_result.fact_frames);
			}
			participant_result.fact_frames_t2 += clause_result.fact_frames_t2;
	
			// Display result in html
			// const output = document.getElementById('output');
			// output.textContent = `Net score: ${net_score}\nOpinion frames: ${opinion_frames_t2}\nFact frames: ${fact_frames_t2}`;
			
			// Parsing nested JSON strings
			// participant_result.opinion_frames = participant_result.opinion_frames.replace(/} {/g, ';')
			// participant_result.fact_frames = participant_result.fact_frames.replace(/} {/g, ';')
			// participant_result.opinion_frames = participant_result.opinion_frames.replace(/{/g, '')
			// participant_result.opinion_frames = participant_result.opinion_frames.replace(/}/g, '')
			// participant_result.fact_frames = participant_result.fact_frames.replace(/{/g, '')
			// participant_result.fact_frames = participant_result.fact_frames.replace(/}/g, '')
		
	});	
		
	console.log("Participant Result: ", participant_result)
		



	/*
	let out_net = summary.net_score
	let out_op_num = summary.opinion_frames_t2
	let out_fp_num = summary.fact_frames_t2
	let out_op = summary.opinion_frames
	let out_fp = summary.fact_frames
	*/
		
		//let op_txt = opinion_frames.map(arr => arr.match);
		//let fact_txt = fact_frames.map(arr => arr.match);
		//console.log(op_txt)
		//console.log(fact_txt)
	
		// const out_net = ["Net Score: ", clause_result.net_score]
		// const out_op = ["Opnion Phrases: ", clause_result.opinion_phrases_t2, ", ", op_txt]
		// const out_fp = ["Fact Phrases: ", clause_result.fact_phrases_t2, ", ", fact_txt]
		// const out_op2 = ["Opnion Phrases: ", clause_result.opinion_phrases_t2, ", ", op_txt.join("; ")]
		// const out_fp2 = ["Fact Phrases: ", clause_result.fact_phrases_t2, ", ", fact_txt.join("; ")]
		
		//let out_op2 = summary.opinion_frames.join("; ")
		//let out_fp2 = summary.fact_frames.join("; ")
		// console.log(out_op)
		// console.log(out_fp)
		//console.log(out_op2)
		//console.log(out_fp2)
		
				
		// jQuery("#out_net").html(out_net);
		// jQuery("#out_op").html(out_op);
		// jQuery("#out_fp").html(out_fp);
		// jQuery("#out_op2").html(out_op2);
		// jQuery("#out_fp2").html(out_fp2);
	
	// jQuery("#Net_Score").html();
	//  jQuery("#out_net").html("<u><b>Net Score:</b></u>" + " " + out_net);
	//  jQuery("#out_op_num").html("<u><b>Number of Opinion Phrases:</b></u>" + " " + out_op_num);
	//  jQuery("#out_fp_num").html("<u><b>Number of Fact Phrases:</b></u>" + " " + out_fp_num);
	//  jQuery("#out_op2").html("<u><b>Opinion Phrases:</b></u>" + " " + out_op);
	//  jQuery("#out_fp2").html("<u><b>Fact Phrases:</b></u>" + " " + out_fp);

	// Then send back the result to the client
	// res.json({
	// 	status: "success",
	// 	net_score: out_net,
	// 	op_frames_num: out_op_num,
	// 	fact_frames_num: out_fp_num,
	// 	op_frames: out_op,
	// 	fact_frames: out_fp
	// });

	return participant_result
	});
}; // end of loop through participant response

// });
// }; 


getData(input).then(() => {
	console.log("Flask Output Arr: ", flask_output_arr);
	const js_output = analyze(flask_output_arr)
});

/*
getData(input).then((summary) => {
	console.log("CSV to be: ", summary)
	const csv = Papa.unparse([summary], {
	  header: true
	});
	console.log("almost a file: ", csv)
	require('fs').writeFileSync('./output.csv', csv);
});
*/

/*/// To be deprecated ////////////////////
//////////////////////////////////////////
app.post('/from_flask_to_node', async (req, res) => {
    console.log("Receiving data from Flask endpoint reached...");
    // Log the data
	console.log(`Data received: ${req.body}`);
	for (let key in req.body) {
		console.log(`${key}: ${req.body[key]}`);
	}
	console.log("Req Headers: ", req.headers);
	
    // Send data to Flask server
    let flask_output = await axios.post('http://127.0.0.1:5000/flask_output', processed_data);

    res.json(flask_output.data);
});
/////////////////////////////////////////*/



// Set the server to listen on port 8080
app.listen(8080, () => {
	console.log('Server is running on port 8080');
});