# Standard library imports

# Public library imports
from pymongo.mongo_client import MongoClient

# import asyncio

# Personal library imports
# Module imports
# Initialized variables
# Remainder of the code


async def test_mongo(uri):
    # Create a new client and connect to the server
    client = MongoClient(uri)

    # Send a ping to confirm a successful connection
    while True:
        try:
            client.admin.command("ping")
            print("Pinged your deployment. You successfully connected to MongoDB!")
        except Exception as e:
            print(e)


def extract_desired_data(data):
    desired_keys = ["die_name", "session_date", "time_rolled", "die_type", "last_roll"]
    new_data = {}
    for key, value in data.items():
        if key in desired_keys:
            new_data[key] = value
    return new_data


def upload_die_result(state, uri, data):
    client = MongoClient(uri)
    try:
        upload_data = extract_desired_data(data)
        db = client["pixels-die-stats"]
        collection = db["pixels-die-stats"]
        result = collection.insert_one(upload_data)
        if state.config["DEBUG"]:
            print(upload_data)
            print(f"Uploaded data with id: {result.inserted_id}")
        pass
    except Exception:
        raise


def show_die_data(uri):
    client = MongoClient(uri)
    while True:
        try:
            db = client["pixels-die-stats"]
            collection = db["pixels-die-stats"]
            cursor = collection.find()
            data = []
            for document in cursor:
                data.append(document)
            return [{k: v for k, v in doc.items() if k != "_id"} for doc in data]
        except Exception:
            raise
