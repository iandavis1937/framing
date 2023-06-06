
## sudo apt install dos2unix
## dos2unix ./app.py

# Reference: https://tms-dev-blog.com/python-backend-with-javascript-frontend-how-to/

# python3 --version
# Search bar "python" > file location
# Ctrl+Shift+P > Python: Create Env > venv > paste path
# python3 -c "import sys; print(sys.path)"
# python3 -m venv venv
# alias activate=". ./venv/bin/activate"
# pip install flask flask-cors spacy
# python3 -m spacy download en_core_web_md
# benepar.download('benepar_en3')

# npm install -g http-server
# run js/html: http-server

import sys
# import logging
from flask import Flask, request, jsonify
import flask
import json
from flask_cors import CORS
import requests
import spacy, benepar
nlp = spacy.load('en_core_web_md')
nlp.add_pipe('benepar', config={'model': 'benepar_en3'})

## Create a logger
# logger = logging.getLogger()
# logger.setLevel(logging.DEBUG)  # Set level to DEBUG to see all messages

## Create a console handler
# console_handler = logging.StreamHandler()
# console_handler.setLevel(logging.DEBUG)  # Ensure all messages are handled

## Add the console handler to the logger
# logger.addHandler(console_handler)

# https://subscription.packtpub.com/book/data/9781838987312/2/ch02lvl1sec13/splitting-sentences-into-clauses

def find_root_of_sentence(doc):
    root_tokens = []
    for token in doc:
        if (token.dep_ == "ROOT"):
            root_tokens.append(token)
    return root_tokens

def find_other_verbs(doc, root_tokens: list[str]):
    other_verbs = []
    for token in doc:
        ancestors = list(token.ancestors)
        if (token.pos_ == "VERB" or token.pos_ == "AUX" and len(ancestors) == 1\
            and ancestors[0] in root_tokens):
            other_verbs.append(token)
    return other_verbs

def get_clause_token_span_for_verb(verb, doc, all_verbs):
    first_token_index = len(doc)
    last_token_index = 0
    this_verb_children = list(verb.children)
    for child in this_verb_children:
        if (child not in all_verbs):
            if (child.i < first_token_index):
                first_token_index = child.i
            if (child.i > last_token_index):
                last_token_index = child.i
    return(first_token_index, last_token_index)

app = Flask(__name__)
CORS(app)
cors = CORS(app, resources={r"/flask": {"origins": "http://localhost"}})

@app.route("/")
def hello():
    return "Hello, World!"

@app.route('/flask_output', methods=["POST"])
def sendData():
    print("Flask sending data endpoint reached...")
    received_data = request.get_json()
    print(f"Received data: {received_data}")
    print(f"Keys: {received_data.keys()}")
    data_string = received_data['open_response']
    if data_string is None:
            # Return a response indicating 'data' is missing.
                return flask.jsonify({'missingData': 'Missing data field'}), 400
    print(f"data_string: {data_string}")
    doc = nlp(data_string)
    for token in doc:
        print(f"Token: {token.text}, POS: {token.pos_}, DEP: {token.dep_}, Is Alphabetic: {token.is_alpha}")
    root_tokens = find_root_of_sentence(doc)
    print(f"Root: {root_tokens}")
    other_verbs = find_other_verbs(doc, root_tokens)
    print(f"Other verbs: {other_verbs}")
    token_spans = []
    all_verbs = root_tokens + other_verbs
    print(f"All verbs: ", all_verbs)
    for other_verb in all_verbs:
        (first_token_index, last_token_index) = \
        get_clause_token_span_for_verb(other_verb, 
                                        doc, all_verbs)
        token_spans.append((first_token_index, 
                            last_token_index))
    sentence_clauses = []
    for token_span in token_spans:
        start = token_span[0]
        end = token_span[1]
        if (start < end):
            clause = doc[start:end]
            sentence_clauses.append(clause)
    sentence_clauses = sorted(sentence_clauses, 
                            key=lambda tup: tup[0])
    clauses_list = [clause.text for clause in sentence_clauses]
    # print(f"Clauses list: {clauses_list}")
    return_data = {
        "status": "success",
        "message": f"received: {data_string}",
        "clauses_text": ']['.join(clauses_list)
    }
    print(f"Output JSON: {return_data}")
    # Send data to Node.js server
    headers = {'From-Flask': 'True'}
    return flask.Response(response=json.dumps(return_data), status=201)

""" To be deprectated
@app.route('/flask_input', methods=["POST"])
def getData():
    print("Flask receiving data endpoint reached...")
    received_data = request.get_json()
    print(f"Received data: {received_data}")
    print(f"Keys: {received_data.keys()}")
    data_string = received_data['participant_input']
    if data_string is None:
            # Return a response indicating 'data' is missing.
                return flask.jsonify({'missingData': 'Missing data field'}), 400
    print(f"data_string: {data_string}")
    doc = nlp(data_string)
    for token in doc:
        print(token.text, token.pos_, token.dep_, token.is_alpha)
    root_tokens = find_root_of_sentence(doc)
    print(f"Root: {root_tokens}")
    other_verbs = find_other_verbs(doc, root_tokens)
    print(f"Other verbs: {other_verbs}")
    token_spans = []
    all_verbs = [root_tokens] + other_verbs
    print(f"All verbs: ", all_verbs)
    for other_verb in all_verbs:
        (first_token_index, last_token_index) = \
        get_clause_token_span_for_verb(other_verb, 
                                        doc, all_verbs)
        token_spans.append((first_token_index, 
                            last_token_index))
    sentence_clauses = []
    for token_span in token_spans:
        start = token_span[0]
        end = token_span[1]
        if (start < end):
            clause = doc[start:end]
            sentence_clauses.append(clause)
    sentence_clauses = sorted(sentence_clauses, 
                            key=lambda tup: tup[0])
    clauses_list = [clause.text for clause in sentence_clauses]
    print(f"Clauses list: {clauses_list}")
    return_data = {
        "status": "success",
        "message": f"received: {data_string}",
        "clauses_text": ']['.join(clauses_list)
    }
    print(return_data)
    # Send data to Node.js server
    headers = {'From-Flask': 'True'}
    try:
        node_server_response = requests.post("http://localhost:8080/flask_input", json=return_data, headers=headers)
    # Check if the request to Node.js server was successful
        print(node_server_response.status_code)
    except Exception as e:
        print('Error:', e)
        return flask.Response(response=json.dumps({"status": "error", "message": str(e)}), status=500)

    if node_server_response.status_code == 200:
        print('Data sent to Node.js server successfully')
    else:
        print('Failed to send data to Node.js server')                 
        return flask.Response(response=json.dumps(return_data), status=201)
"""



if __name__ == "__main__":
    app.run("127.0.0.1", 5000)
    # app.run("localhost", 7000)
