const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const db = require("./db/db");
const updateActivity = require("./middleware/updateActivity");

const { swaggerUi, swaggerSpec } = require("./swagger/swagger");

const app = express();
app.use(express.json());
app.use(cors());

// -------------------------------
// PUBLIC ROUTES
// -------------------------------
const publicPaths = [
    "/api/users/login",
    "/api/users/register",
    "/"
];

// -------------------------------
// AUTH MIDDLEWARE
// -------------------------------
function auth(req, res, next) {
    // Публічні шляхи дозволені
    if (publicPaths.some(p => req.path.startsWith(p))) return next();

    // Swagger — теж публічний
    if (req.path.startsWith("/api-docs")) return next();

    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Token missing" });

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET123");

        // Перевірка блокування користувача
        db.get("SELECT IsBlocked, BlockReason FROM Users WHERE Id=?", [decoded.id], (err, user) => {
            if (user && user.IsBlocked)
                return res.status(403).json({
                    error: "User is blocked",
                    reason: user.BlockReason
                });

            req.user = decoded;
            next();
        });
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

// AUTH COMES FIRST
app.use(auth);

// UPDATE ACTIVITY — only for authenticated users
app.use(updateActivity);

// -------------------------------
// SWAGGER
// -------------------------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// -------------------------------
// ROUTES
// -------------------------------
app.use("/api/animals", require("./routes/animals"));
app.use("/api/users", require("./routes/users"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/medical-records", require("./routes/medicalRecords"));
app.use("/api/state-records", require("./routes/stateRecords"));
app.use("/api/treatments", require("./routes/treatments"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/smart-devices", require("./routes/smartDevices"));
app.use("/api/admin", require("./routes/admin"));

// Root message
app.get("/", (req, res) => {
    res.send("Pet Shelter API is running");
});

app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
    console.log("Swagger available at http://localhost:3000/api-docs");
});
