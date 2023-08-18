# framing Package User Guide
## Description
framing analyzes English language text responses for the writer's use of wise communication techniques for contentious discussions.
For each text response, framing returns 

 - the number of times the writer couched their view as their own subjective viewpoint (used an 'opinion frame'),
 - the number of times the writer stated a view as an objective fact (used a 'fact frame'),
 - and the number of times the writer made a subjective statement which does not hedge a statement about the world (a 'non-hedge subjective statement'/'NHS').

The algorithm also returns the text that triggered the classification as a opinion frame/fact frame/NHS and the corresponding regular expression in the script.
Importantly, framing splits text responses into clauses before classifying each clause as an opinion frame, fact frame, NHS, or none of the above. This is the primary function of the Python script and the spaCy/benepar packages.

# User Guide
### Make a Call to a Running Instance of framing 
Once framing is deployed on a server, it can receive text inputs as individual strings or csv files.
#### Via terminal
 - Open a terminal of your choice.
 - To send input as a string, send an application/json POST request to  http://<your.server.ip.address>:8080/string. The string's header should be 'participant_input'.

 ```bash
 # Ex. -- change IP address as needed
 curl -X POST -H "Content-Type: application/json" -d '{"participant_input":"I think this is test 1. This is test 2. I support adding an NHS test."}' http://localhost:8080/string
```

 - To send input as a csv file, send an application/json POST request to  http://<your.server.ip.address>:8080/csv. The string's header should be 'participant_input'.
 
```bash
 # Ex. -- change IP address as needed
curl -X POST -F "csvFile=@C:/.../study2.csv" http://localhost:8080/csv
```

#### Qualtrics integration
![Qualtrics Integration](https://github.com/iandavis1937/framing/tree/main/readme_files/qualtrics_integration.png)

 To make a call to framing from within a Qualtrics survey, first set the respondent's text response as an embedded variable. Then, send it to framing via a web service block like above.

## Install framing
🍏 [MacOS Instructions](https://github.com/iandavis1937/framing/tree/main/readme_files/install_mac.md)

🐧 [Ubuntu AWS EC2 Instructions](https://github.com/iandavis1937/framing/tree/main/readme_files/install_ec2_ubuntu.md)

## Set Up an AWS EC2 Instance
[Ubuntu AWS EC2 Set-Up Instructions](https://github.com/iandavis1937/framing/tree/main/readme_files/aws.md)