// Import necessary modules
// const axios = require('axios');
const express = require('express');
const slowDown = require("express-slow-down");
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });  // set the destination directory of uploaded files
const Papa = require('papaparse');
const winston = require('winston');
const { type } = require('os');
const zeromq = require('zeromq');
const path = require('path');

// Record the date
const today = new Date();
const month = String(today.getMonth() + 1).padStart(2, '0'); // JavaScript months are 0-based.
const day = String(today.getDate()).padStart(2, '0');
const hour = String(today.getHours()).padStart(2, '0');
const minute = String(today.getMinutes()).padStart(2, '0');

const time_str = `${month}_${day}_${hour}_${minute}`;
console.log("Time: ", time_str);

// Create a Winston logger
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
	  new winston.transports.File({ filename: 'error.log', level: 'error' }),
	  new winston.transports.File({ filename: 'combined.log', level: 'info' })
	]
  });
  
// Also log to the console
// if (process.env.NODE_ENV !== 'production') {
logger.add(new winston.transports.Console({
	format: winston.format.simple()
}));
// }

function parseCSV(data, delimiter, input_colname) {
    let parsedData = Papa.parse(data, { delimiter: delimiter, header: true }).data;
	return parsedData.filter(row => row[input_colname] !== 'NA');
}


const reqSocket = zeromq.socket('req');

// Connect your socket to the server endpoint
reqSocket.connect('ipc:///tmp/zeromq.sock');


// Function to send an initialization message
function sendInitializationMessage() {
    return new Promise((resolve, reject) => {
        // Send a predefined init message
        console.log("Sending HELLO...")
        reqSocket.send(JSON.stringify({ greeting: 'HELLO' }));

        reqSocket.once("message", function(reply) {
            const response = JSON.parse(reply.toString());
            if (response.greeting === 'HELLO_ACK') {
                console.log("Initialization successful.");
                resolve();
            } else {
                reject(new Error("Failed initialization handshake."));
            }
        });

        reqSocket.once("error", function(error) {
            reject(error);
        });
    });
}


// Function to send a request, return a promise that is resolved when the reply is received
function sendZmqRequest(outboundMessage) {

    // The function returns a Promise, which will either be resolved when a reply to
    // the ZeroMQ request is received, or rejected if there's an error.
    return new Promise((resolve, reject) => {

        // Sends a request over the ZeroMQ socket: outboundMessage object is a JSON string
        reqSocket.send(JSON.stringify(outboundMessage));

        // 'message' event handler set-up: This event is emitted by ZeroMQ when a
        // reply to the request is received.
        // At around line 300, final message is sent back to HTTP requester &
        // 'error' event handler is set up
        // The 'message' and 'error' listeners will be removed after being triggered once
        reqSocket.once("message", function(reply) {
            // Logs the reply that was received.
            // console.log("Received py output: ", reply.toString());

            let py_output = reply.toString();
            let part_id = py_output && py_output.hasOwnProperty('part_id') 
            ? py_output.part_id 
            : undefined;
            let response_arr = py_output.split('][');

            let participant_result = {};
            participant_result.part_id = part_id
            participant_result.clauses = py_output
            participant_result.clauses_t2 = response_arr.length
            participant_result.input = ''
            participant_result.net_score = 0
            participant_result.opinion_frames = []
            participant_result.opinion_frames_t2 = 0
            participant_result.opinion_clauses_t2 = 0
            participant_result.opinion_clauses = []
            participant_result.nhs_frames = []
            participant_result.nhs_frames_t2 = 0
            participant_result.nhs_clauses = []
            participant_result.nhs_clauses_t2 = 0
            participant_result.fact_frames = []
            participant_result.fact_frames_t2 = 0
            participant_result.fact_clauses = []
            participant_result.fact_clauses_t2 = 0
            let response;
            let response_words;
            let opinion_frames;
            let fact_frames;
            // console.log("Response Array: ", response_arr);
            response_arr.map((response, index) => {
                response = response.replace(/\s+/g, ' ');
                response = response.replace(/\"/g, '');
                // response = response.replace(/\'/g, '');
                response_words = response.toString().split(' ')
                        .map((w) => w.toLowerCase().replace(/[\W]/g, ''));
        
                // Define regular expressions
                const DONT_PHRASES_ARR = ["dont"," don't"," do not"," can not"," cant"," can't"];
                const DONT_PHRASES = DONT_PHRASES_ARR.join("|");
                // const PRONOUNS_ARR = ["he","she","it","they"];
                // const PRONOUNS = PRONOUNS_ARR.join("|");
                const PRONOUNS_REGEX = new RegExp(`(?:\\b(?:he|she|it|they)\\b)`, 'i');
                // const PRESIDENT_NAMES_ARR = ["candidate","clinton","donald","gop","hillary","hilary","trump","trum"];
                // const PRESIDENT_NAMES = PRESIDENT_NAMES_ARR.join("|");
                const PRESIDENT_NAMES_REGEX = new RegExp(`(?:\\b(candidate(?:s)?|clinton|donald|gop|hillary|hilary|trump|trum)\\b)`, 'i');
                const SKIP_WORDS_ARR = ["also"," really"," very much"];
                const SKIP_WORDS = SKIP_WORDS_ARR.join("|");
                // const AMBIGUOUS_WORDS_ARR = ["seemed","prefer"];
                // const AMBIGUOUS_WORDS_REGEX = new RegExp(AMBIGUOUS_WORDS_ARR.join("|"), 'i');
                const AMBIGUOUS_WORDS_REGEX = new RegExp(`(?:\\b(?:seem|seems|seemed|prefer|prefers|preferred|might|maybe)\\b)`, 'gmi')
                const I_OPINION_WORDS_ARR = ["agree","believe","consider","disagree","hope","feel","felt","find","oppose","think","thought","support"];
                const I_OPINION_WORDS = I_OPINION_WORDS_ARR.join("|");
                const OPINION_PHRASES_ARR = ["in my opinion","it seems to me","from my perspective","in my view","from my view","from my standpoint","for me"];
                const OPINION_PHRASES = OPINION_PHRASES_ARR.join("|");
        
                const OPINION_FRAME_REGEXES = [
                    {op_label: "op1", op_regex: new RegExp(`(?:\\bi\\b(?: )?(?:\\b\\w+\\b)?(?: )?(?:do|dont|don't|do not|can|can not|cant|can't|cannot|also|really|very much)?(?: )?(?:\\b\\w+\\b)? \\b(?:agree|agreed|am agreeing|believe|beleive|beleieve|believed|am believing|consider|considered|am considering|disagree|disagreed|am disagreeing|hope|hoped|am hoping|feel|felt|am feeling|think|thought|am thinking|see|saw|am seeing|question|questioned|am questioning|suppose|am supposing|am\\b \\bunsure|share(?: )?(?:\\b\\w+\\b)?(?: )?(?:\\b\\w+\\b)? (?:views|beliefs|opinions|perspectives|standpoints)|have(?: )?(?:\\b\\w+\\b)?(?: )?(?:\\b\\w+\\b)? (?:views|beliefs|opinions|perspectives|standpoints)|(?:cannot|can't) say for sure)\\b(?:.{0,20}))`, 'gmi')},
                    {op_label: "op2", op_regex: new RegExp(`(?:(?:\\bi'm\\b|\\bi\\b \\bam\\b)(?: )?(?:really|very much|not|not really|not very much)? [a-z]+ to \\b(?:agree|believe|beleive|beleieve|consider|disagree|hope|feel|felt|think|thought|see|saw|question|suppose|share(?: )?(?:\\b\\w+\\b)?(?: )?(?:\\b\\w+\\b)? (?:views|beliefs|opinions|perspectives|standpoints))\\b(?:.{0,20}))`, 'gmi')},
                    {op_label: "op3", op_regex: new RegExp(`(?:\\b(?:in\\b my opinion|from my perspective|\\bin\\b my view|from my view|from my standpoint|from my viewpoint|from where I stand|\\bfor\\b \\bme|\\bto\\b \\bme|my views|my understanding|(?:view(?:s)?|opinion(?:s)?|standpoint(?:s)?|viewpoint(?:s)?|belief(?:s)?|perspective(?:s)?)\\b \\bmirror(?:s)?\\b \\bmine|(?:view(?:s)?|opinion(?:s)?|standpoint(?:s)?|viewpoint(?:s)?|belief(?:s)?|perspective(?:s)?) (?:are|is) the same as mine)\\b(?:.{0,20}))`, 'gmi')},
                    {op_label: "op4", op_regex: new RegExp(`(?:(?:\\bi'm\\b|\\bi\\b \\bam\\b)(?: )?(?:really|very much|not|not really|not very much)? (?:a|an)(?: firm| strong)? (?:believer)(?:.{0,20}))`, 'gmi')},
                    {op_label: "op5", op_regex: new RegExp(`(?:(?:\\bi'm\\b|\\bi\\b \\bam\\b)(?: )?(?:not|(?:not )?very much|(?:not )?really|(?:not )?especially|(?:not )?particularly)?(?: )?(?:\\b\\w+\\b)? \\bnot\\b (?:positive|sure|certain)\\b(?:.{0,20}))`, 'gmi')},
                    {op_label: "op6", op_regex: new RegExp(`(?:(?:(?<!\\bhe|\\bshe|\\bthey|candidate(?:s)?|clinton|donald|gop|hillary|hilary|trump|trum)\\b make(?:s)?\\b me \\bfeel|\\bmake(?:s)?\\b me \\b(?:agree|believe|beleive|beleieve|consider|disagree|hope|feel|think|suppose|see|question))\\b(?:.{0,20}))`, 'gmi')}
                ];
                    
                const NHS_REGEXES = [
                    {nhs_label: "nhs1", nhs_regex: new RegExp(`(?:\\bi\\b(?: )?(?:\\b\\w+\\b)?(?: )?(?:do|dont|don't|do not|can|can not|cant|can't|cannot|also|really|very much)?(?: )?(?:\\b\\w+\\b)? \\b(?:find|oppose|support|favor|lie|don't\\b \\bknow|do\\b \\bnot\\b \\bknow|\\b \\bwith|side\\b \\bwith)\\b(?:.{0,20}))`, 'gmi')},
                    {nhs_label: "nhs2", nhs_regex: new RegExp(`(?:(?:\\bi'm\\b|\\bi\\b \\bam\\b)(?: )?(?:really|very much|not|not really|not very much)? [a-z]+ to \\b(?:find|oppose|support|favor|lie\\b \\bwith|side\\b \\bwith)\\b(?:.{0,20}))`, 'gmi')},
                    {nhs_label: "nhs3", nhs_regex: new RegExp(`(?:(?:\\bi'm\\b|\\bi\\b \\bam\\b)(?: )?(?:really|very much|not|not really|not very much)? a(?: firm| strong)? (?:supporter|proponent|critic)(?:.{0,20}))`, 'gmi')},
                    {nhs_label: "nhs4", nhs_regex: new RegExp(`(?:\\bi\\b(?:.{0,20}))`, 'gmi')},
                    {nhs_label: "nhs5", nhs_regex: new RegExp(`(?:\\b(?:bothers|bothered|terrifies|terrified|scares|scared|angers|angered|annoys|annoyed|frustrates|frustrated|excites|excited|thrills|thrilled|worries|worried|concerns|concerned|saddens|saddened|encourages|encouraged|inspires|inspired|calms|calmed|reassures|reassured|gives|gave|surprises|surprised|amazes|amazed|shocks|shocked|disgust|disgusted|delights|delighted|pleases|pleased|upsets|upsetted|disturbs|disturbed|disappoints|disappointed|confuses|confused|alarms|alarmed|fascinates|fascinated|astonishes|astonished)\\b \\bme\\b(?:.{0,20}))`, 'gmi')}
                ];
                
                const FACT_FRAME_REGEXES = [
                    {f_label: "fp1", f_regex: new RegExp(`(?:\\b[tT]he\\b \\b[A-Z][a-z]+\\b \\b(?:can|can't|cannot|demonstrates|demonstrate|is|isn't|are|aren't|was|wasn't|were|weren't|does|doesn't|did|didn't|has|hasn't|had|hadn't|will|won't|would|wouldn't|should|shouldn't|needs|need)\\b(?:.{0,20}))`, 'gm')}, // deprecate?
                    {f_label: "fp2", f_regex: new RegExp(`(?:(?:\\b[A-Z][a-z]+\\b|\\b[a-z]+\\b) \\b(?:can|can't|cannot|demonstrates|demonstrate|is|isn't|are|aren't|was|wasn't|were|weren't|does|doesn't|did|didn't|has|hasn't|had|hadn't|will|won't|would|wouldn't|should|shouldn't|needs|need)\\b(?:.{0,20}))`, 'gm')},
                    {f_label: "fp3", f_regex: new RegExp(`(?:\\b[tT]he\\b [A-Z][a-z]+(?:\'s)? \\b[a-z]+\\b \\b(?:can|can't|cannot|demonstrates|demonstrate|is|isn't|are|aren't|was|wasn't|were|weren't|does|doesn't|did|didn't|has|hasn't|had|hadn't|will|won't|would|wouldn't|should|shouldn't|needs|need)\\b(?:.{0,20}))`, 'gm')}, // deprecate?
                    {f_label: "fp4", f_regex: new RegExp(`(?:X  (?:\\b[Hh][Ee]\\b|\\b[Ss][Hh][Ee]\\b|\\b[Ii][Tt]\\b|\\b[Tt][Hh][Ee][Yy]\\b) \\b(?:can|can't|cannot|demonstrates|demonstrate|is|isn't|are|aren't|was|wasn't|were|weren't|does|doesn't|did|didn't|has|hasn't|had|hadn't|will|won't|would|wouldn't|should|shouldn't|needs|need)\\b(?:.{0,20}))`, 'gm')}, /// deprecate?
                    {f_label: "fp5", f_regex: new RegExp(`(?:(?:\\b[Hh][Ee]\\b|\\b[Ss][Hh][Ee]\\b|\\b[Ii][Tt]\\b|\\b[Tt][Hh][Ee][Yy]\\b) \\b(?:can|can't|cannot|demonstrates|demonstrate|is|isn't|are|aren't|was|wasn't|were|weren't|does|doesn't|did|didn't|has|hasn't|had|hadn't|will|won't|would|wouldn't|should|shouldn't|needs|need)\\b(?:.{0,20}))`, 'gm')},
                    {f_label: "fp6", f_regex: new RegExp(`(?:\\b(?:[Cc][Aa]ndidate|[Cc][Ll]inton|[Dd][Oo]nald|gop|GOP|GOp|[Hh][Ii]llary|[Hh][Ii]lary|[Tt][Rr]ump|[Tt][Rr]um)\\b \\b(?:can|can't|cannot|demonstrates|demonstrate|is|isn't|are|aren't|was|wasn't|were|weren't|does|doesn't|did|didn't|has|hasn't|had|hadn't|will|won't|would|wouldn't|should|shouldn't|needs|need)\\b(?:.{0,20}))`, 'gm')},
                    {f_label: "fp7", f_regex: new RegExp(`(?:\\b(?:[Hh][Ee]|[Ss][Hh][Ee]|[Ii][Tt]|[Tt][Hh][Ee][Yy]|[Cc][Aa]ndidate|[Cc][Ll]inton|[Dd][Oo]nald|gop|GOP|GOp|[Hh][Ii]llary|[Hh][Ii]lary|[Tt][Rr]ump|[Tt][Rr]um)\\b (?:\\b[a-z]+(?:ed|[^ia]s\\b))(?:.{0,20}))`, 'gm')},
                    {f_label: "fp8", f_regex: new RegExp(`(?:(?:\\b[Hh][Ee]\\b|\\b[Ss][Hh][Ee]\\b|\\b[Ii][Tt]\\b|\\b[Tt][Hh][Ee][Yy]\\b|[Cc][Aa]ndidate|[Cc][Ll]inton|[Dd][Oo]nald|gop|GOP|GOp|[Hh][Ii]llary|[Hh][Ii]lary|[Tt][Rr]ump|[Tt][Rr]um) (?:\\b\\w+\\b) (?:\\b[a-z]+(?:ed|[^ia]s\\b))(?:.{0,20}))`, 'gm')},
                    {f_label: "fp9", f_regex: new RegExp(`(?:(?:\\bShe\'s\\b|\\bHe\'s\\b|\\bThey\'re\\b)(?:.{0,20}))`, 'gmi')}
                ];
                
                
                // Check for opinion frames: loop through opinion frame regexes
                let opinion_frames = [];
                // console.log("Initiate Op Frames: ", JSON.parse(JSON.stringify(opinion_frames)))
                OPINION_FRAME_REGEXES.forEach(({ op_label, op_regex }) => {
                    let response_lower = response.toLowerCase();
                    // console.log(response_lower)
                    let op_match = response_lower.match(op_regex);
                    if (op_match) {
                        // console.log(op_match)
                        op_match.forEach((match) => {
                            opinion_frames.push({ match: match, label: op_label });
                        });      
                    };
                });
                // End of loop through opinion frame regexes/opinion frame check
                // console.log("Populated Op Frames: ", JSON.parse(JSON.stringify(opinion_frames)))
                
                let nhs_frames = [];
                if (!opinion_frames.length) {
                    // Check for non-hedge subjective statements: loop through nhs regexes
                    // console.log("Initiate NHS: ", JSON.parse(JSON.stringify(nhs)))
                    NHS_REGEXES.forEach(({ nhs_label, nhs_regex }) => {
                    let nhs_match = response.match(nhs_regex);
                        if (nhs_match) {
                            // push to output array
                                nhs_match.forEach((match) => {
                                    nhs_frames.push({ match: match, label: nhs_label });
                                });
                            };
                        }); // End of loop through nhs regexes
                    };
                // End of loop to populate nhs array


                let fact_frames = [];
                if (!opinion_frames.length & !nhs_frames.length) {
                    // Check for fact frames: loop through fact frame regexes
                    // console.log("Initiate Fact Frames: ", JSON.parse(JSON.stringify(fact_frames)))
                    FACT_FRAME_REGEXES.forEach(({ f_label, f_regex }) => {
                    let fact_match = response.match(f_regex);
                        if (fact_match) {
                            fact_match.forEach((match) => {
                                fact_frames.push({ match: match, label: f_label });
                            });
                            // }; // end
                        };
                    });
                    // End of loop through fact frame regexes/fact frame check
                    // console.log("Populated Fact Frames: ", JSON.parse(JSON.stringify(fact_frames)))
        
                    // Filter fact_frames: filter out phrases that are really op frames
                    // by looping through op frame regexes
                    fact_frames = fact_frames.filter((frame_i) => {
                        const lowerCaseFrame = frame_i.match.toLowerCase();
                        // note, trying to log the outcomes of the following filter tests here by 
                        // storing them in a variable will alter the behavior of the filter
                        // due to indexing 
                        // Reset lastIndex to 0 immediately after calling test
                        const ambigTest = AMBIGUOUS_WORDS_REGEX.test(lowerCaseFrame);
                        AMBIGUOUS_WORDS_REGEX.lastIndex = 0;
                        return (
                            opinion_frames.every(opinion => !lowerCaseFrame.includes(opinion.match)) &&
                            !ambigTest
                        );
                    });
                    // console.log("Op Frame Filtered Fact Frames: ", JSON.parse(JSON.stringify(fact_frames)))
                }; 
                // End of fact frames block
                    
                let opinion_frames_t2 = opinion_frames.length
                let nhs_frames_t2 = nhs_frames.length
                let fact_frames_t2 = fact_frames.length
                let opinion_clauses
                let nhs_clauses
                let fact_clauses
                let opinion_clauses_t2 = 0
                let nhs_clauses_t2 = 0
                let fact_clauses_t2 = 0
                let net_score = 0
                

                if (opinion_frames.length) {
                    opinion_clauses = response+"]]"
                    opinion_clauses_t2 = 1
                    nhs_clauses = ""
                    nhs_clauses_t2 = 0
                    fact_clauses = ""
                    fact_clauses_t2 = 0
                    net_score = 1
                } else {
                    opinion_clauses = ""
                    opinion_clauses_t2 = 0
                    if (fact_frames.length){
                        fact_clauses = response+"]]"
                        fact_clauses_t2 = 1
                        net_score = -1
                    } else {
                        fact_clauses = ""
                        net_score = 0
                        fact_clauses_t2 = 0
                        if (nhs_frames.length) {
                            nhs_clauses = response+"]]"
                            nhs_clauses_t2 = 1
                        }
                    }
                }
        
                const clause_result = {
                    part_id: part_id,
                    input: response,
                    net_score: net_score,
                    opinion_frames: opinion_frames.map(obj => JSON.stringify(obj)).join(", "),
                    opinion_frames_t2: opinion_frames_t2,
                    opinion_clauses: opinion_clauses,
                    opinion_clauses_t2: opinion_clauses_t2,
                    nhs_frames: nhs_frames.map(obj => JSON.stringify(obj)).join(", "),
                    nhs_frames_t2: nhs_frames_t2,
                    nhs_clauses: nhs_clauses,
                    nhs_clauses_t2: nhs_clauses_t2,
                    fact_frames: fact_frames.map(obj => JSON.stringify(obj)).join(", "),
                    fact_frames_t2: fact_frames_t2,
                    fact_clauses: fact_clauses,
                    fact_clauses_t2: fact_clauses_t2
                    };
                // console.log("Clause Result: ", JSON.parse(JSON.stringify(clause_result)))
    
                //Update participant_result
                participant_result.input += '__' + clause_result.input;
                participant_result.net_score += clause_result.net_score;
                // Opinions
                if(clause_result.opinion_frames) { 
                    participant_result.opinion_frames.push(clause_result.opinion_frames);
                }
                if(clause_result.opinion_clauses) { 
                    participant_result.opinion_clauses.push(clause_result.opinion_clauses);
                }
                participant_result.opinion_frames_t2 += clause_result.opinion_frames_t2;
                participant_result.opinion_clauses_t2 += clause_result.opinion_clauses_t2;
                
                // NHSs
                if(clause_result.nhs_frames) { 
                    participant_result.nhs_frames.push(clause_result.nhs_frames);
                }
                if(clause_result.nhs_clauses) { 
                    participant_result.nhs_clauses.push(clause_result.nhs_clauses);
                }
                participant_result.nhs_frames_t2 += clause_result.nhs_frames_t2;
                participant_result.nhs_clauses_t2 += clause_result.nhs_clauses_t2;

                // Facts
                if(clause_result.fact_frames) { 
                    participant_result.fact_frames.push(clause_result.fact_frames);
                }
                if(clause_result.fact_clauses) { 
                    participant_result.fact_clauses.push(clause_result.fact_clauses);
                }
                participant_result.fact_frames_t2 += clause_result.fact_frames_t2;
                participant_result.fact_clauses_t2 += clause_result.fact_clauses_t2;
        });	
        // console.log("Participant Result: ", participant_result)
        
        let opinion_frames_str = ""
        if (participant_result.opinion_frames.length){
            let op_jsonArrayString = "[" + participant_result.opinion_frames[0] + "]";
            // console.log(op_jsonArrayString)
            let op_objArray = JSON.parse(op_jsonArrayString);
            let opinion_frames_str = op_objArray.map(obj => obj.match).join('...; ');
        } else {
            let opinion_frames_str = ""
        }

        let nhs_frames_str = ""
        if (participant_result.nhs_frames.length){
            let nhs_jsonArrayString = "[" + participant_result.nhs_frames[0] + "]";
            let nhs_objArray = JSON.parse(nhs_jsonArrayString);
            let nhs_frames_str = nhs_objArray.map(obj => obj.match).join('...; ');
        } else {
            let nhs_frames_str = ""
        }

        let fact_frames_str = ""
        if (participant_result.fact_frames.length){
            let f_jsonArrayString = "[" + participant_result.fact_frames[0] + "]";
            let f_objArray = JSON.parse(f_jsonArrayString);
            let fact_frames_str = f_objArray.map(obj => obj.match).join('...; ');
        } else {
            let fact_frames_str = ""
        }
    
        // Send back the result to the client
        let finalResult = {
            status: "success",
            clauses: participant_result.clauses, 
            clauses_t2: participant_result.clauses_t2,
            net_score: participant_result.net_score,
            opinion_frames: participant_result.opinion_frames,
            opinion_frames_t2: participant_result.opinion_frames_t2,
            opinion_clauses: participant_result.opinion_clauses,
            opinion_clauses_t2: participant_result.opinion_clauses_t2,
            opinion_frames_str: opinion_frames_str,
            nhs_frames: participant_result.nhs_frames,
            nhs_frames_t2: participant_result.nhs_frames_t2,
            nhs_clauses: participant_result.nhs_clauses,
            nhs_clauses_t2: participant_result.nhs_clauses_t2,
            nhs_frames_str: nhs_frames_str,
            fact_frames: participant_result.fact_frames,
            fact_frames_t2: participant_result.fact_frames_t2,
            fact_clauses: participant_result.fact_clauses,
            fact_clauses_t2: participant_result.fact_clauses_t2,
            fact_frames_str: fact_frames_str
        };
    
        /* return participant_result 
        }); // end of loop through participant response
    }; // end of analyze */

            // Logs the processed string.
            // console.log("Sending final result: ", finalResult);

            console.log("Resolving promise", finalResult.clauses.slice(0,10))
            // The Promise is resolved with the processed string.
            resolve(finalResult);
        });

        // The 'error' event handler is set up. This event is emitted by ZeroMQ when there's
        // an error. If this happens, the Promise is rejected with the error object.
        reqSocket.on('error', reject);
    });
}


reqSocket.connect("ipc:///tmp/zeromq.sock");

let app = express();
app.use(express.json());  // to parse JSON in the body of POST requests

// An Express.js route handler for POST requests to '/string'
app.post('/string', async (req, res) => {
    console.log("JS string endpoint reached...");
    console.log("Req Headers: ", req.headers);
    for (let key in req.body) {
        console.log(`${key}: ${req.body[key]}`);
        }

    // Retrieves the 'participant_input' from the request body
    let participant_input = req.body.participant_input;

    // Creates an outbound message object containing a command and the participant_input
    const outboundMessage = {
        input: participant_input
    };

    try {
        // First send initialization message
        await sendInitializationMessage();

        // Sends the outbound message over the ZeroMQ socket using the sendZmqRequest function,
        // and waits for the Promise it returns to be resolved with the processed string
        let finalResult = await sendZmqRequest(outboundMessage);

        // Sends a response with a JSON body containing a status field and the processed result
        res.json({ status: "success", data: finalResult });

    } catch (err) {
        // If an error occurred (for example, if sendZmqRequest rejected the Promise), logs the error
        // and sends a response with a 500 status code and a JSON body containing a status field
        // and an error message
        console.error(err);
        res.status(500).json({ status: "error", message: "An error occurred while processing the request." });
    }
});


app.post('/csv', upload.single('csvFile'), async (req, res) => {
    console.log("request: ", req.body);

    // Access the column names for the input text and case id sent with the form
    let id = req.body.id;
    console.log("ID column: ", id);

    let input_colname = req.body.colname;
    console.log("Column to analyze: ", input_colname);

    // This will store the uploaded file in a csvFile field in the request
    let csvFile = req.file;
    console.log("File uploaded: ", csvFile.path)

    for (let key in req.file) {
        console.log(`${key}: ${req.file[key]}`);
    }

    // Parse the CSV file
    let fileData = await fs.readFile(csvFile.path, 'utf8');
    let loadedCSV = parseCSV(fileData, ",", input_colname);
    
    // Filter out rows where the ID column is blank or undefined
    loadedCSV = loadedCSV.filter(row => row[id] !== undefined && row[id].trim() !== "");
    console.log("loadedCSV first row: ", loadedCSV[0])
    console.log("loadedCSV last row: ", loadedCSV[loadedCSV.length - 1])
    let finalResult
    let output_arr = []

    // Sends IPC initialization message
    console.log("Initializing IPC...")
    await sendInitializationMessage();
        
    // Process each row in the uploaded csv
    for (let row of loadedCSV) {
        console.log("row: ", row)
        let part_id = row[id];
        let participant_input = row[input_colname];
        console.log("row: ", participant_input)


        // Creates an outbound message object containing a command and the participant_input
        const outboundMessage = {
            input: participant_input
        };

        try {
            
            // Sends the outbound message over the ZeroMQ socket using the sendZmqRequest function,
            // and waits for the Promise it returns to be resolved with the processed string
            let finalResult = await sendZmqRequest(outboundMessage);

            // console.log("Processed row", finalResult)
            finalResult.part_id = part_id;

            // append final result to array
            output_arr.push(finalResult);

            // Sends a response with a JSON body containing a status field and the processed result
            // res.json({ status: "success", data: finalResult });

        } catch (err) {
            // If an error occurred (for example, if sendZmqRequest rejected the Promise), logs the error
            // and sends a response with a 500 status code and a JSON body containing a status field
            // and an error message
            console.error(err);
            res.status(500).json({ status: "error", message: "An error occurred while processing the request." });
        }
    }

    let finalFile = Papa.unparse(output_arr);
    // console.log("finalFile: ", finalFile); // logs CSV string

    // To write this to a file:
    const outputFilePath = `./../output/output_${time_str}.csv`;
    fs.writeFile(outputFilePath, finalFile, function(err) {
        if (err) {
            console.log('Error saving the file:', err);
            res.status(500).json({ status: "error", message: "An error occurred while processing the request." });
        } else {
            console.log('File saved at:', path.resolve(outputFilePath));  // This prints the absolute path
            res.download(outputFilePath); // This will prompt file download
        }
    });
}); 

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
