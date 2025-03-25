const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files from "scripts"
app.use(express.static(path.join(__dirname, "scripts")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "scripts", "beg-page.html"), (err) => {
        if (err) {
            res.status(500).send("Error loading beg-page.html");
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});