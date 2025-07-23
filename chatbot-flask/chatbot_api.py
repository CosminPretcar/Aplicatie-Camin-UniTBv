import json
from flask import Flask, request, jsonify
import tensorflow as tf
import pickle
import numpy as np

#Încarcă modelul și tool-urile
model = tf.keras.models.load_model("chatbot_model.keras")
with open("vectorizer.pickle", "rb") as f:
    vectorizer = pickle.load(f)
with open("label_encoder.pickle", "rb") as f:
    label_encoder = pickle.load(f)

#Încarcă datele din datasetChatBot.json
with open("datasetChatBot.json", "r", encoding="utf-8") as f:
    dataset = json.load(f)
responses = {item["tag"]: item["responses"] for item in dataset["intents"]}

app = Flask(__name__)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")

    if not message:
        return jsonify({"response": "Mesajul este gol."})

    X = vectorizer.transform([message]).toarray()
    prediction = model.predict(X)
    predicted_index = np.argmax(prediction)
    confidence = np.max(prediction)
    tag = label_encoder.inverse_transform([predicted_index])[0]

    print(f"[DEBUG] Mesaj: '{message}' | Tag prezis: '{tag}' | Încredere: {confidence:.2f}")

    if confidence > 0.6:
        response = responses.get(tag, ["Îmi pare rău, nu am înțeles întrebarea."])[0]
    else:
        response = "Îmi pare rău, nu am înțeles întrebarea."

    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)
