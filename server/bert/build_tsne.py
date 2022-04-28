from asyncore import write
import json

from sklearn.manifold import TSNE

from sentence_transformers import SentenceTransformer
from pymongo import MongoClient;

client = MongoClient()
posts_db = client["last-forest"].reddit

posts = {}
for doc in posts_db.find({}):
    posts[doc["permalink"]] = doc

print(len(posts), "posts fetched")


""" f = open("./posts.json", encoding="utf-8")
data= json.load(f)
print(type(data)) """

text = []
permalinks = []
for d in posts:
    """ print(posts[d])
    print(posts[d]["title"]) """
    """ if "title" in d: """
    text.append(posts[d]["title"]);
    permalinks.append(posts[d]["permalink"])

# remove duplicates
""" text = list(dict.fromkeys(text)) """


model = SentenceTransformer("paraphrase-MiniLM-L6-v2")
embeddings = model.encode(text)
keys = []
i = 0;
for sentence, embedding in zip(text, embeddings):
    keys.append(sentence)
    print("Sentence:", sentence)
    print("Permalink:", permalinks[i])
    print("Embedding:", embedding, len(embedding))
    print("")
    i+=1

tsne = TSNE(n_components=2, verbose=1, random_state=123);
result = tsne.fit_transform(embeddings).tolist()
zero_exists = False
for i in range(len(result)):
    if i == 0 : zero_exists = True
    print(i)
    result[i].append(permalinks[i])
""" print(result) """
print("Included 0:" , zero_exists)
with open("result.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=4)

for data in result:
    posts_db.update_one(
        {"permalink" : data[2]},
        {"$set": {
            "tsne_coordinates": {
                "x":data[0],
                "y":data[1]
            }
        }}
    )


""" print(text); """