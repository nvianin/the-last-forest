import json
import torch
from transformers import BertTokenizer, BertModel

f = open("./posts.json", encoding="utf-8")
data= json.load(f)
text = "[CLS] "
for d in data:
    if "title" in d:
        """ print(d["title"]) """
        text += d["title"] + " [SEP] "
#print(data[0])
""" print(text) """

tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
tokenized = tokenizer.tokenize(text);

indexed_tokens = tokenizer.convert_tokens_to_ids(tokenized)
""" for tup in zip(tokenized, indexed_tokens):
    print('{:<12} {:>6,}'.format(tup[0], tup[1])) """

segments_id = [1] * len(tokenized)
print(len(segments_id), " segments ids")
print(len(indexed_tokens), "indexed tokens")

tokens_tensor = torch.tensor([indexed_tokens])
segments_tensors = torch.tensor([segments_id])

print(tokens_tensor.size(), "tokens tensor size")
print(segments_tensors.size(), "segments tensor size")

model = BertModel.from_pretrained("bert-base-uncased", 
output_hidden_states=True,
)

model.eval()

with torch.no_grad():
    outputs = model(tokens_tensor, segments_tensors)
    hidden_states = outputs[2]

print ("Number of layers:", len(hidden_states), "  (initial embeddings + 12 BERT layers)")
layer_i = 0

print ("Number of batches:", len(hidden_states[layer_i]))
batch_i = 0

print ("Number of tokens:", len(hidden_states[layer_i][batch_i]))
token_i = 0

print ("Number of hidden units:", len(hidden_states[layer_i][batch_i][token_i]))


""" print(tokenized) """