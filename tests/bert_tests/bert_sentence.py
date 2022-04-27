from asyncore import write
import json

from sklearn.manifold import TSNE

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
keys = []

for sentence, embedding in zip(text, embeddings):
    keys.append(sentence)
    print("Sentence:", sentence)
    print("Embedding:", embedding, len(embedding))
    print("")

tsne = TSNE(n_components=2, verbose=1, random_state=123);
result = tsne.fit_transform(embeddings).tolist()

print(result)
with open("result.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=4)

""" print(text); """