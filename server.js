const express = require('express');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const port = 3000;

// Basic middleware
app.use(express.json());
app.use(express.static('scripts'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'scripts', 'formalities.html'));
});

app.get('/quiz', (req, res) => {
    res.sendFile(path.join(__dirname, 'scripts', 'quiz.html'));
});

// Simple admin authentication
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Access"');
        return res.status(401).send('Authentication required');
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    if (username === 'admin' && password === 'twinpact2024') {
        return next();
    }
    
    res.set('WWW-Authenticate', 'Basic realm="Admin Access"');
    return res.status(401).send('Invalid credentials');
};

// Admin-only data viewing
app.get('/view-data', adminAuth, (req, res) => {
    try {
        let data = {
            formResponses: [],
            quizResponses: [],
            combinedResponses: []
        };

        // Read form responses
        if (fs.existsSync('responses.xlsx')) {
            const formWorkbook = XLSX.readFile('responses.xlsx');
            data.formResponses = XLSX.utils.sheet_to_json(formWorkbook.Sheets['Form Responses']);
        }

        // Read quiz responses
        if (fs.existsSync('quiz_responses.xlsx')) {
            const quizWorkbook = XLSX.readFile('quiz_responses.xlsx');
            data.quizResponses = XLSX.utils.sheet_to_json(quizWorkbook.Sheets['Quiz Responses']);
        }

        // Read combined responses
        if (fs.existsSync('combined_responses.xlsx')) {
            const combinedWorkbook = XLSX.readFile('combined_responses.xlsx');
            data.combinedResponses = XLSX.utils.sheet_to_json(combinedWorkbook.Sheets['Combined Responses']);
        }

        // Create HTML response with escape for safety
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>TwinPact Data</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    h2 { color: #333; }
                </style>
            </head>
            <body>
                <h1>TwinPact Data</h1>
                
                <h2>Form Responses (${data.formResponses.length})</h2>
                <table>
                    <tr>
                        ${Object.keys(data.formResponses[0] || {}).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                    ${data.formResponses.map(row => `
                        <tr>
                            ${Object.values(row).map(value => `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}
                        </tr>
                    `).join('')}
                </table>

                <h2>Quiz Responses (${data.quizResponses.length})</h2>
                <table>
                    <tr>
                        ${Object.keys(data.quizResponses[0] || {}).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                    ${data.quizResponses.map(row => `
                        <tr>
                            ${Object.values(row).map(value => `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}
                        </tr>
                    `).join('')}
                </table>

                <h2>Combined Responses (${data.combinedResponses.length})</h2>
                <table>
                    <tr>
                        ${Object.keys(data.combinedResponses[0] || {}).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                    ${data.combinedResponses.map(row => `
                        <tr>
                            ${Object.values(row).map(value => `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}
                        </tr>
                    `).join('')}
                </table>
            </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).send('Error reading data');
    }
});

// Handle form submissions - simplified
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
        
        // Update combined sheet
        updateCombinedSheet();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).json({ success: false, error: 'Failed to save data' });
    }
});

// Handle quiz submissions - simplified
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
        
        // Update combined sheet
        updateCombinedSheet();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving quiz data:', error);
        res.status(500).json({ success: false, error: 'Failed to save data' });
    }
});

// Function to update the combined sheet
function updateCombinedSheet() {
    try {
        let workbook;
        const combinedFilePath = 'combined_responses.xlsx';
        
        // Load or create workbook
        if (fs.existsSync(combinedFilePath)) {
            workbook = XLSX.readFile(combinedFilePath);
        } else {
            workbook = XLSX.utils.book_new();
            workbook.SheetNames.push('Combined Responses');
            workbook.Sheets['Combined Responses'] = XLSX.utils.json_to_sheet([]);
        }
        
        // Load form responses
        let formResponses = [];
        if (fs.existsSync('responses.xlsx')) {
            const formWorkbook = XLSX.readFile('responses.xlsx');
            formResponses = XLSX.utils.sheet_to_json(formWorkbook.Sheets['Form Responses']);
        }
        
        // Load quiz responses
        let quizResponses = [];
        if (fs.existsSync('quiz_responses.xlsx')) {
            const quizWorkbook = XLSX.readFile('quiz_responses.xlsx');
            quizResponses = XLSX.utils.sheet_to_json(quizWorkbook.Sheets['Quiz Responses']);
        }
        
        // Combine responses
        const combinedData = formResponses.map(form => {
            const quiz = quizResponses.find(q => q.email === form.email);
            return {
                ...form,
                ...(quiz || {}),
                form_submitted_at: form.timestamp,
                quiz_submitted_at: quiz ? quiz.timestamp : null
            };
        });
        
        // Update the combined sheet
        const newSheet = XLSX.utils.json_to_sheet(combinedData);
        workbook.Sheets['Combined Responses'] = newSheet;
        
        // Save the file
        XLSX.writeFile(workbook, combinedFilePath);
    } catch (error) {
        console.error('Error updating combined sheet:', error);
    }
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});