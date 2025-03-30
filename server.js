const express = require('express');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('scripts'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'scripts', 'formalities.html'));
});

app.get('/quiz', (req, res) => {
    res.sendFile(path.join(__dirname, 'scripts', 'quiz.html'));
});

// Handle form submissions
app.post('/submit', (req, res) => {
    try {
        const data = req.body;
        data.timestamp = new Date().toISOString();
        
        // Load or create workbook
        let workbook;
        const filePath = 'responses.xlsx';
        
        if (fs.existsSync(filePath)) {
            workbook = XLSX.readFile(filePath);
        } else {
            workbook = XLSX.utils.book_new();
            workbook.SheetNames.push('Form Responses');
            workbook.Sheets['Form Responses'] = XLSX.utils.json_to_sheet([]);
        }
        
        // Get the existing data
        const sheet = workbook.Sheets['Form Responses'];
        const existingData = XLSX.utils.sheet_to_json(sheet);
        
        // Add new response
        existingData.push(data);
        
        // Update the sheet
        const newSheet = XLSX.utils.json_to_sheet(existingData);
        workbook.Sheets['Form Responses'] = newSheet;
        
        // Save the file
        XLSX.writeFile(workbook, filePath);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).json({ success: false, error: 'Failed to save data' });
    }
});

// Handle quiz submissions
app.post('/submit-quiz', (req, res) => {
    try {
        const data = req.body;
        data.timestamp = new Date().toISOString();
        
        // Load or create workbook
        let workbook;
        const filePath = 'quiz_responses.xlsx';
        
        if (fs.existsSync(filePath)) {
            workbook = XLSX.readFile(filePath);
        } else {
            workbook = XLSX.utils.book_new();
            workbook.SheetNames.push('Quiz Responses');
            workbook.Sheets['Quiz Responses'] = XLSX.utils.json_to_sheet([]);
        }
        
        // Get the existing data
        const sheet = workbook.Sheets['Quiz Responses'];
        const existingData = XLSX.utils.sheet_to_json(sheet);
        
        // Add new response
        existingData.push(data);
        
        // Update the sheet
        const newSheet = XLSX.utils.json_to_sheet(existingData);
        workbook.Sheets['Quiz Responses'] = newSheet;
        
        // Save the file
        XLSX.writeFile(workbook, filePath);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving quiz data:', error);
        res.status(500).json({ success: false, error: 'Failed to save data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});