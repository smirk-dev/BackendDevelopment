// L03 Task 1 — Hello World server
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Backend Server Running");
});

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
