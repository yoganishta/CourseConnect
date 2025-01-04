from PIL import Image
import pytesseract
import re
from pymongo import MongoClient

# Update Tesseract path (use raw string to avoid escape issues)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["myapp"]
collection = db["timetables"]

# Function to process image and extract data
def extract_timetable_from_image(image_path):
    text = pytesseract.image_to_string(Image.open(image_path))
    lines = text.split("\n")

    data = []
    for line in lines:
        # Use regex to match the structure of the table
        match = re.match(r"(IT\d{4})\s+(.*?)\s+(.*)", line)
        if match:
            subject_code = match.group(1)
            subject_name = match.group(2).strip()
            staff_incharge = match.group(3).strip()
            data.append({
                "subject_code": subject_code,
                "subject_name": subject_name,
                "staff_incharge": staff_incharge
            })
    return data

# Store extracted data in MongoDB
def store_data_in_mongodb(data):
    for entry in data:
        collection.insert_one(entry)

if __name__ == "__main__":
    # Use raw string for the image path
    image_path = r"C:\Users\YOGANISHTA\Documents\tt\ttpic.jpg"  # Path to the uploaded image
    timetable_data = extract_timetable_from_image(image_path)
    store_data_in_mongodb(timetable_data)
    print("Timetable data successfully extracted and stored in MongoDB!")
