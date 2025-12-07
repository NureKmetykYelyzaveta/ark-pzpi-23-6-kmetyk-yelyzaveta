const express = require("express");
const cors = require("cors");
const { swaggerUi, swaggerSpec } = require("./swagger/swagger.js");

const app = express();
app.use(express.json());
app.use(cors());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/animals", require("./routes/animals"));
app.use("/api/users", require("./routes/users"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/medical-records", require("./routes/medicalRecords"));
app.use("/api/state-records", require("./routes/stateRecords"));
app.use("/api/treatments", require("./routes/treatments"));
app.use("/api/logs", require("./routes/logs"));

app.get("/", (req, res) => {
    res.send("Pet Shelter API is running");
});

app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
    console.log("Swagger UI on http://localhost:3000/api-docs");
});
