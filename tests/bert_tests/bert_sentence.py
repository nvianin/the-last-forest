import json
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("paraphrase-MiniLM-L6-v2")

f = open("./posts.json", encoding="utf-8")
data= json.load(f)
text = []
for d in data:
    if "title" in d:
        text.append(d["title"]);

# remove duplicates
text = list(dict.fromkeys(text))

embeddings = model.encode(text)

for sentence, embedding in zip(text, embeddings):
    print("Sentence:", sentence)
    print("Embedding:", embedding)
    print("")

""" print(text); """