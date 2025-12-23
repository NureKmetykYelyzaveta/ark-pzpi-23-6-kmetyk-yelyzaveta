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

const publicStartsWith = [
  "/api/users/login",
  "/api/users/register",
  "/api-docs"
];

function auth(req, res, next) {
  if (req.path === "/") return next();

  if (publicStartsWith.some(p => req.path.startsWith(p))) return next();

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Не авторизовано" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET123");

    db.get(
      "SELECT IsBlocked, BlockReason FROM Users WHERE Id=?",
      [decoded.id],
      (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!user) return res.status(401).json({ message: "Не авторизовано" });

        if (user.IsBlocked) {
          return res.status(403).json({
            message: "Користувача заблоковано",
            reason: user.BlockReason
          });
        }

        req.user = decoded;
        next();
      }
    );
  } catch (e) {
    return res.status(401).json({ message: "Не авторизовано" });
  }
}

app.use(auth);

app.use((req, res, next) => {
  if (!req.user) return next();
  return updateActivity(req, res, next);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use("/api/animals", require("./routes/animals"));
app.use("/api/users", require("./routes/users"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/medical-records", require("./routes/medicalRecords"));
app.use("/api/state-records", require("./routes/stateRecords"));
app.use("/api/treatments", require("./routes/treatments"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/smart-devices", require("./routes/smartDevices"));
app.use("/api/admin", require("./routes/admin"));


app.get("/", (req, res) => {
  res.send("Pet Shelter API is running");
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
  console.log("Swagger available at http://localhost:3000/api-docs");
});
