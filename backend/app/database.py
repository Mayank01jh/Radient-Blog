from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# MongoDB Atlas connection string from environment variable
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set!")

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

