
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
# python3 -m spacy download en_core_web_sm

# npm install -g http-server
# run js/html: http-server

import sys
# import logging
import time
start_time = time.time()


import json
import requests
import zmq
print("ZeroMQ and related mods imported... ", time.time() - start_time)

import spacy
from spacy.tokens import Doc, Span, Token
from spacy.language import Language
print("Spacy imported... ", time.time() - start_time)
import benepar
benepar.download('benepar_en3')
print("Benepar imported... ", time.time() - start_time)

import nltk
from nltk import Tree, ParentedTree

import re 
from string import punctuation
import inflect
from pprint import pprint

p = inflect.engine()



## Create a logger
# logging.basicConfig(filename='py_framing.log', level=logging.DEBUG, 
#                     format='%(asctime)s %(levelname)s %(message)s', datefmt='%m/%d/%Y %I:%M:%S %p')
# sys.stdout = open('py_framing.log', 'w')
# sys.stderr = sys.stdout


# Function to convert number into words 
def convert_number(input_string): 
    output_words = []  # Create an empty list to store the words
    words = input_string.split()  # Split the input string into words
    for word in words:
        if word.isdigit(): 
            output_words.append(p.number_to_words(word))  # Append the number in words
        else: 
            output_words.append(word)  # Append the word as it is
    output_string = ' '.join(output_words)  # Join the transformed words back into a string
    return output_string


def convert_punctuation(text):
    punctuation_mapping = {"`": "", "~": "", "@": "", "#": "", "$": "",
                           "%": " percent", "^": " ", "&": "and", "*": "",
                           "-": " ", "_": "", "+": " plus ", "=": " equals ",
                           "{": "", "}": "", "[": "", "]": "", "|": "",
                           "\\": " slash ",
                           "<": " is less than ",">": " is greater than ",
                           "/": " slash "}
    mult_punct_regex = re.compile(r'([{}])\1+'.format(re.escape(punctuation))) 
    text = mult_punct_regex.sub(r'\1', text)  # Replace repeated punctuation with singular using regex
    text = text.translate(str.maketrans(punctuation_mapping))
    clean_quotes = {"\' ": "\'", "\" ": "\""}
    for old, new in clean_quotes.items():
        text = text.replace(old, new)
    mult_space_regex = re.compile(r' {2,}') 
    text = mult_space_regex.sub(' ', text)
    return text.strip()


class ClauseSegmentation:
    """Use the benepar tree to split sentences and blind entities."""
    # print("WHNP: ", spacy.explain('WHNP'))
    
    def __init__(self, nlp: Language, name: str):
        self.nlp = nlp
        self.name = name
        
    def write_S_tree(self, tree):
        tree = tree.pformat() # Convert the tree to a string
        parenth_stack = []
        S_stack = []
        new_tree = ''
        for i, char in enumerate(tree):
            new_tree += char
            if char == '(':
                parenth_stack.append(i) # Push the index of the open parenthesis onto the stack
                if i+1 < len(tree) and tree[i+1] == 'S':  # Check if the next character is 'S'
                    S_stack.append(i)
            elif char == ')':
                if parenth_stack:
                    open_paren_index = parenth_stack.pop() # Pop the matching open parenthesis from the stack
                    if open_paren_index in S_stack:
                        new_tree += '\n'  # Add newline after '(S )' block
                        S_stack.remove(open_paren_index)
                else:
                    print(f'Unmatched closing parenthesis at index {i}')

        while parenth_stack: # Any remaining open parentheses on the stack are unmatched
            print(f'Unmatched opening parenthesis at index {parenth_stack.pop()}')
        return new_tree

        # tree = tree.replace(')', ')\n')  # Add a newline after each ')' # Remove any line that only contains whitespace
        # tree = '\n'.join(line for line in tree.split('\n') if line.strip())
        # return tree
        
    def print_all_constituents(self, constituent):
        # Print the current constituent
        print(f"Constituent: '{constituent}', labels: {constituent._.labels}")
        # Recursively print all constituents of the current constituent
        for child in constituent._.children:
            self.print_all_constituents(child)
    

    def find_children_w_label(self, constituent, label):
        """Uses recursion to check if the constituent has any children, grandchildren, etc. w/ 'X' label"""
        if label in constituent._.labels:
            parent = constituent._.parent
            print(parent)
            return(parent)
            #return (parent.start, parent.end)
        for child in constituent._.children:
            result = self.find_children_w_label(child, label)
            if result is not None:  # if a tuple was found
                return result
        return None  # return None if no tuple was found


    def find_constituent_w_label(self, constituent, label):
        """Uses recursion to check if the constituent has any children, grandchildren, etc. w/ 'X' label"""
        print(f"{constituent}, const. labs: {constituent._.labels}, {type(constituent._.labels)}")
        try:
            leaf_label = constituent._.labels[0]
            print("leaf lab ", leaf_label)
        except IndexError:
            leaf_label = None
        if leaf_label == label and len(constituent._.labels) == 1:
            print("Base: ", constituent)
            return(constituent)
            #return (parent.start, parent.end)
        for child in constituent._.children:
            result = self.find_constituent_w_label(child, label)
            if result is not None:  # if a tuple was found
                print("Return Result: ", result)
                return result
        return None  # return None if no tuple was found

    # def find_constituent_w_label(constituent, label):
    #     """Uses recursion to check if the constituent and its descendants have 'X' label"""
    #     matches = []
    #     if constituent._.labels == label and len(constituent._.labels[0]) == len(label):
    #         matches.append(constituent)
    #     for child in constituent._.children:
    #         matches += (find_constituent_w_label(child, label))
    #     return matches


    def benepar_split(self, doc: Doc) -> list[tuple]:
        """Split a doc into individual clauses
        doc (Doc): Input doc containing one or more sentences
        RETURNS (List[Tuple]): List of extracted clauses, defined by their start-end offsets
        """
       
        split_indices = []
        for sentence in doc.sents:
            print("Parse tree:")
            pprint(sentence._.parse_string, indent = 4)
            #self.print_all_constituents(sentence)
            parse_tree = ParentedTree.fromstring('(' + sentence._.parse_string + ')')
            S_tree = self.write_S_tree(parse_tree)
            print(parse_tree.pretty_print())
            print(S_tree, type(S_tree))
            with open('clause_test.txt', 'a') as file:
                file.write(str(sentence)+"\n")
                file.write(sentence._.parse_string)
                file.write(S_tree)
                file.write("\n\n")
                
            print("Inventory Split Indices: ", split_indices)
            print("Full Sentence: ", sentence)
            can_split = False
            for constituent in sentence._.constituents:
                print(f"Outside: '{constituent}', labels = {constituent._.labels}, parent = {constituent._.parent}")
                try:
                    leaf_label = str(constituent._.labels[0])
                    print("leaf lab ", leaf_label)
                except IndexError:
                    leaf_label = None
                
                # Check if sentence can be split by "S" clauses that are children of the original sentence
                #if "S" in constituent._.labels or "SINV" in constituent._.labels and constituent._.parent == sentence:
                if leaf_label in ("S", "SINV") and constituent._.parent == sentence:
                    print(f"Inside S Split Block: '{constituent}', labels = {constituent._.labels}, parent = {constituent._.parent}")
                    
                    # Check if "S" clause can be split by "WHNP" clauses that are children of the "S" clause
                    WHNP_result = self.find_children_w_label(constituent, "WHNP")
                    print(f"WHNP Result: {WHNP_result}")
                    if isinstance(WHNP_result, spacy.tokens.span.Span):
                        print("leaf A: non WHNP + WHNP from S")
                        print(f"Inside WHNP Split Block: '{WHNP_result}', labels = {WHNP_result._.labels}")
                        non_WHNP_indices = (constituent.start, WHNP_result.start)
                        WHNP_result_indices = (WHNP_result.start, WHNP_result.end)
                        split_indices.append(non_WHNP_indices)
                        split_indices.append(WHNP_result_indices)
                        print(split_indices)
                        can_split = True
                    elif (constituent.start, constituent.end) not in split_indices:
                        print("leaf B: S")
                        print(f"No WHNP Split: '{constituent}', labels = {constituent._.labels}")
                        split_indices.append((constituent.start, constituent.end))
                        print(split_indices)
                        can_split = True
                        
                # If no "S" clause split, check if sentence can be split by "WHNP" clauses that are children of the original sentence
                elif constituent._.parent == sentence:
                    WHNP_result = self.find_children_w_label(constituent, "WHNP")
                    print(f"WHNP Result: {WHNP_result}")
                    if isinstance(WHNP_result, spacy.tokens.span.Span):
                        print(f"Inside WHNP Split Block: '{WHNP_result}', labels = {WHNP_result._.labels}")
                        WHNP_result_indices = (WHNP_result.start, WHNP_result.end)
                        
                        # Check if "WHNP" clause can be split by "S" clauses that are children of the "WHNP" clause
                        lower_S_result = self.find_constituent_w_label(WHNP_result, "S")
                        print(f"S_result: {lower_S_result}")
                        if isinstance(lower_S_result, spacy.tokens.span.Span):
                            print("leaf C1: non WHNP + WHNP + lower S from clause w/ WHNP element")
                            print(f"Inside Lower S Split Block: '{lower_S_result}', labels = {lower_S_result._.labels}")
                            non_sub_indices = (sentence.start, WHNP_result_indices[0])
                            lower_S_indices = (lower_S_result.start, lower_S_result.end)
                            split_indices.append(non_sub_indices)
                            split_indices.append(WHNP_result_indices)
                            split_indices.append(lower_S_indices)
                            print(split_indices)
                            can_split = True
                            
                        else:
                            print("leaf C2: non WHNP + WHNP from clause w/ WHNP element")
                            print(f"No Lower S Split: '{WHNP_result}', labels = {WHNP_result._.labels}")
                            non_WHNP_indices = (sentence.start, WHNP_result.start)
                            split_indices.append(non_WHNP_indices)
                            split_indices.append(WHNP_result_indices)
                            print(split_indices)
                            can_split = True
                            
                        
            # If no "S" clause split or "WHNP" split, append the whole sentence as one clause
            if can_split == False and (sentence.start, sentence.end) not in split_indices:
                print("leaf D: whole sentence")
                print(f"No Split: '{sentence}', labels = {sentence._.labels}")
                split_indices.append((sentence.start, sentence.end))
                print(split_indices)
        return split_indices
        

    def __call__(self, doc: Doc):
        """Extract clauses and save the split indices in a custom attribute"""
        clauses = []
        split_indices = self.benepar_split(doc)
        # print(split_indices)
        for index_start, index_end in split_indices:
            current_span = doc[index_start : index_end]
            clause_text = current_span.text  # get the text of the current span
            clause_text = convert_punctuation(clause_text)
            clause_text = clause_text.strip()
            clauses.append(
                {
                    "split_indices": (index_start,index_end),
                    "clause_text": clause_text,
                    #"has_ent": True, #"ent_indices": (entity.start, entity.end),
                    #"blinder": f"_{entity.label_}_", #"ent_name": entity.text,
                    #"cats": {},
                }
            )

        # Check if ._.clauses exists and only overwrite when len() == 0
        if not doc.has_extension("clauses") or (
            doc.has_extension("clauses") and len(doc._.clauses) == 0
        ):
            doc.set_extension("clauses", default={}, force=True)
            doc._.clauses = clauses

        return doc

@Language.factory("framing_segmentation_v0")
def make_segmentation(nlp: Language, name: str):
    return ClauseSegmentation(nlp, name)

nlp = spacy.load('en_core_web_sm', disable=["ner"])
print("Spacy language loaded... ", time.time() - start_time)
if spacy.__version__.startswith('2'):
    nlp.add_pipe(benepar.BeneparComponent("benepar_en3"))
else:
    nlp.add_pipe("benepar", config={"model": "benepar_en3"})
    nlp.add_pipe("framing_segmentation_v0")  # add custom component to the pipeline
print("Spacy pipes loaded... ", time.time() - start_time)
print("Imports and spacy pipeline creation complete. ")

#test_str = """I think this is a benepar slash test and this could be a second (S split) . Just in case, here's number three which is a great opportunity to "add a fourth"(WHNP split)!" I believe this is a fifth test and 'here' is a sixth test which permits a seventh test as well(S then WHNP split). Here is an eighth test(no split). And, finally, here is an unnecessary comma laden ninth test, and this is a tenth test which has an eleventh test, and I think there is even a twelfth test as well."""
test_str = """  I think this is a benepar\ test and this could be a       second (S split)  .
                Just in case,,,, here's number 3 which is a great opportunity to \"add a fourth\"(WHNP split)!
                I believe this is a fifth test and 'here' is a sixth test which permits  a seventh test as well(S then WHNP split).
                Here is an _eighth_ test(no split).
                Finally, here is an unnecessary-comma-laden ninth test, and this is a tenth test which has an eleventh test, and I think there is even a twelfth test as well."""
                

# Temp Test
test_str = """I don't think much of either one of them. Hillary seems very establishment, while Donald can't seem to keep his mouth shut. That said, I feel like Donald is the better choice simply for being something different."""

test_str = convert_number(test_str)
print(test_str)
test_str = convert_punctuation(test_str)
print(test_str)
test_doc = nlp(test_str)
print("Test Clauses:")
pprint(test_doc._.clauses, indent=4)
clauses_dict = test_doc._.clauses
del test_doc
clauses_list = [item['clause_text'] for item in clauses_dict]
print(f"Clauses list: {clauses_list}")
clauses_text = ']['.join(clauses_list)
clauses_text = clauses_text.replace('"input":', '', 1)
print("End of test\n", clauses_text)
# logging.shutdown()
    
context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("ipc:///tmp/zeromq.sock")

while True:
    participant_input = socket.recv_string()
    print("IPC reached...")
    print(f"Received data: {participant_input}")
    participant_input = json.loads(participant_input)
    # Extract the value of "input"
    participant_input = participant_input["input"]
    participant_input = convert_number(participant_input)
    participant_input = convert_punctuation(participant_input)
    print(f"converted numbers and punctuation: {participant_input}")
    doc = nlp(participant_input)
    # for token in doc:
    #   print(f"Token: {token.text}, POS: {token.pos_}, DEP: {token.dep_}, Is Alphabetic: {token.is_alpha}")

    clauses_dict = doc._.clauses
    del doc
    print(clauses_dict)
    clauses_list = [item['clause_text'] for item in clauses_dict]
    print(f"Clauses list: {clauses_list}")
    clauses_text = ']['.join(clauses_list)
    # if item.part_id:
    #     result["part_id"] = item.part_id
    # response.headers['From-Py'] = 'True'
    socket.send_string(clauses_text)

# Run Uvicorn server separately
