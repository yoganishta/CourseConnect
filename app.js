const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const { exec } = require('child_process'); // Ensure you import exec
const User = require('./User');
const Timetable = require('./Timetable');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myapp')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const db = mongoose.connection;

// Serve login.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Handle login form submission
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Hardcoded email and password
    const hardcodedEmail = '1@gmail.com';
    const hardcodedPassword = '1';

    if (email === hardcodedEmail && password === hardcodedPassword) {
        return res.redirect('/dashboard');
    } else {
        return res.send('<h3 class="text-danger">Invalid email or password!</h3>');
    }
});


// Serve the timetable upload page
app.get('/insert_timetable', (req, res) => {
    res.sendFile(path.join(__dirname, 'insert_timetable.html'));
});

app.get('/courseid', (req, res) => {
    res.sendFile(path.join(__dirname, 'courseid.html'));
});

app.get('/search_staff', (req, res) => {
    res.sendFile(path.join(__dirname, 'search_staff.html'));
});

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify upload directory
    },
    filename: (req, file, cb) => {
        const year = req.body.year; // Get year from the form
        const semester = req.body.semester; // Get semester from the form
        const ext = path.extname(file.originalname); // Get the file extension
        cb(null, `${year}_${semester}${ext}`); // Format the filename as year_semester.ext
    }
});

const upload = multer({ storage: storage });

// Middleware to serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Handle timetable upload
app.post('/upload_timetable', upload.single('timetable'), (req, res) => {
    console.log('Request Body:', req.body); // Log the request body
    console.log('Uploaded File:', req.file); // Log the uploaded file info

    const semester = req.body.semester;
    const year = req.body.year;
    const timetableFile = req.file;

    if (!timetableFile) {
        return res.status(400).send('No file uploaded.');
    }
    const filePath = timetableFile.path;

    // Execute the Python script
    exec(`python extract_and_store_timetable.py "${filePath}"`, async (error, stdout, stderr) => {
        // Error handling for the Python execution
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return res.status(500).send('Error processing the timetable.');
        }

        // Check for any errors produced by the Python script
        if (stderr) {
            console.error(`Python script stderr: ${stderr}`);
            return res.status(500).send('Error in Python script execution.');
        }

        try {
            // Parse the JSON output from Python
            const extractedData = JSON.parse(stdout);

            // Save to MongoDB
            const newTimetable = new Timetable({
                semester,
                year,
                data: extractedData
            });
            await newTimetable.save();

            // Send response after successful processing
            res.send(`Timetable for Semester ${semester}, Year ${year} has been uploaded and stored successfully!`);
        } catch (err) {
            console.error(`Error parsing JSON or saving timetable to MongoDB: ${err}`);
            return res.status(500).send('Error storing timetable in the database.');
        }
    });
});

// API for searching courses
app.post('/api/search-course', async (req, res) => {
    const { courseId } = req.body;
    console.log(`Received courseId: ${courseId}`);

    try {
        const timetableCollection = mongoose.connection.collection('timetables');
        const courseData = await timetableCollection.find({ subject_code: courseId }).toArray();

        if (courseData.length === 0) {
            return res.status(404).json({ error: 'No matching courses found' });
        }

        res.status(200).json(courseData);
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ error: 'Error fetching course details' });
    }
});

// API for searching staff
app.post('/api/search-staff', async (req, res) => {
    const { staffName } = req.body;
    console.log(`Received staffName: ${staffName}`);

    try {
        const timetableCollection = mongoose.connection.collection('timetables');
        const courseData = await timetableCollection.find({ staff_incharge: staffName }).toArray();

        if (courseData.length === 0) {
            return res.status(404).json({ error: 'No matching courses found' });
        }

        res.status(200).json(courseData);
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ error: 'Error fetching course details' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
