from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://Mayank1234:mayank1234@mydata.ezd5wcv.mongodb.net/")

# Create a new client and connect to the server
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")
except Exception as e:
    print(f"Failed to connect to MongoDB! {e}") 

# Select database and collection (single time)
database = client["radient"]


# The collection name is `posts` in your MongoDB
collection = database["posts"]

def get_database():
    return database 

def get_collection():
    return collection 


def get_posts():
    return collection.find()

