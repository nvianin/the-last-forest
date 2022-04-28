from asyncore import write
import json

""" from sklearn.manifold import TSNE

from sentence_transformers import SentenceTransformer """
from pymongo import MongoClient;

client = MongoClient("mongodb://localhost:27017")
client.connect()
""" print(client) """
print("fuck you")

# model = SentenceTransformer("paraphrase-MiniLM-L6-v2")

# f = open("./posts.json", encoding="utf-8")
# data= json.load(f)
# print(type(data))

# text = []
# permalinks = []
# for d in data:
#     """ if "title" in d: """
#     text.append(d["title"]);
#     permalinks.append(d["permalink"])

# # remove duplicates
# """ text = list(dict.fromkeys(text)) """


# embeddings = model.encode(text)
# keys = []
# i = 0;
# for sentence, embedding in zip(text, embeddings):
#     keys.append(sentence)
#     print("Sentence:", sentence)
#     print("Permalink:", permalinks[i])
#     print("Embedding:", embedding, len(embedding))
#     print("")
#     i+=1

# tsne = TSNE(n_components=2, verbose=1, random_state=123);
# result = tsne.fit_transform(embeddings).tolist()
# zero_exists = False
# for i in range(len(result)):
#     if i == 0 : zero_exists = True
#     print(i)
#     result[i].append(permalinks[i])
# """ print(result) """
# print("Included 0:" , zero_exists)
# with open("result.json", "w", encoding="utf-8") as f:
#     json.dump(result, f, ensure_ascii=False, indent=4)


# """ print(text); """