"""Module for uploading die data to MongoDB Atlas"""

# Standard library imports
import asyncio

# Public library imports
from pymongo.mongo_client import MongoClient
import motor.motor_asyncio

# Personal library imports
# Module imports
# Initialized variables
# Remainder of the code


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
    except Exception:
        raise


async def show_die_data_stuff(uri):
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client["pixels-die-stats"]
    collection = db["pixels-die-stats"]
    try:
        cursor = collection.find()
        data = []
        async for document in cursor:
            data.append(document)
        return [{k: v for k, v in doc.items() if k != "_id"} for doc in data]
    except Exception:
        raise


async def show_die_data(state):
    uri = state.config["mongodb_atlas_uri"]
    # print(state.config["mongodb_atlas_uri"])
    while True:
        await asyncio.sleep(5)
        state.mongo_data = await show_die_data_stuff(uri)
