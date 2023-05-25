
## sudo apt install dos2unix
## dos2unix ./app.py

# Reference: https://tms-dev-blog.com/python-backend-with-javascript-frontend-how-to/

# python3 --version
# Search bar "python" > file location
# Ctrl+Shift+P > Python: Create Env > venv > paste path
# python3 -c "import sys; print(sys.path)"
# python3 -m venv venv
# alias activate=". ../.env/bin/activate"
# pip install flask flask-cors spacy
# python3 -m spacy download en_core_web_sm

# npm install -g http-server
# run js/html: http-server

import sys
from flask import Flask, request
import flask
import json
from flask_cors import CORS
import spacy
nlp = spacy.load('en_core_web_sm')

# https://subscription.packtpub.com/book/data/9781838987312/2/ch02lvl1sec13/splitting-sentences-into-clauses

def find_root_of_sentence(doc):
    root_token = None
    for token in doc:
        if (token.dep_ == "ROOT"):
            root_token = token
    return root_token

def find_other_verbs(doc, root_token):
    other_verbs = []
    for token in doc:
        ancestors = list(token.ancestors)
        if (token.pos_ == "VERB" and len(ancestors) == 1\
            and ancestors[0] == root_token):
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

@app.route("/")
def hello():
    return "Hello, World!"

@app.route('/users', methods=["GET", "POST"])
def getClauses():
    print("users endpoint reached...")
    if request.method == "GET":
        with open("users.json", "r") as f:
            data = json.load(f)
            # data.append({
            #     "username": "user4",
            #     "pets": ["hamster"]
            # })
            return flask.jsonify(data)
    if request.method == "POST":
        received_data = request.get_json()
        print(f"received data: {received_data}")
        data_string = received_data['data']
        print(data_string)
        doc = nlp(data_string)
        root_token = find_root_of_sentence(doc)
        print(root_token)
        other_verbs = find_other_verbs(doc, root_token)
        print(other_verbs)
        token_spans = []
        all_verbs = [root_token] + other_verbs
        for other_verb in all_verbs:
            (first_token_index, last_token_index) = \
            get_clause_token_span_for_verb(other_verb, 
                                            doc, all_verbs)
            token_spans.append((first_token_index, 
                                last_token_index))
        return_data = {
            "status": "success",
            "message": f"received: {data_string}"
        }
        print(return_data)
        return flask.Response(response=json.dumps(return_data), status=201)
    

if __name__ == "__main__":
     app.run("0.0.0.0", 7000)
    #app.run("localhost", 7000