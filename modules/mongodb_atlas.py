# Standard library imports

# Public library imports
from pymongo.mongo_client import MongoClient

# import asyncio

# Personal library imports
# Module imports
# Initialized variables

# Remainder of the code

# Connection String: mongodb+srv://nightpanda2810:<password>@pixels-die-stats.qqvzppt.mongodb.net/


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


async def upload_die_result(uri, data):
    client = MongoClient(uri)
    while True:
        try:
            pass
        except Exception as e:
            print(e)
            raise
