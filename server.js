const express = require("express");
const bodyParser = require("body-parser");
const connection = require("./db");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Server run in http://localhost:${port}`);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const query = "SELECT * FROM users WHERE email = ? AND password = ?";
  connection.query(query, [email, password], (error, results) => {
    if (error) {
      console.error("Error executing login query:", error);
      return res
        .status(500)
        .json({ error: "An error occurred while executing login query" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = results[0];
    console.log("Login Success");
    return res.status(200).json({ message: "Login successful", user });
  });
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
  connection.query(query, [name, email, password], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to register user" });
    } else {
      res.json({ message: "Registration successful" });
    }
  });
});

app.post("/request_unit", (req, res) => {
  const { user_id, address, latlong, situation, unit } = req.body;
  const status = "Pending";

  const query = `INSERT INTO request_unit (user_id, address, latlong, situation, unit, status) VALUES (?, ?, ?, ?, ?, ?)`;
  const values = [user_id, address, latlong, situation, unit, status];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Failed to register request unit" });
    }

    return res
      .status(200)
      .json({ message: "Request unit registered successfully" });
  });
});

app.get("/users", (req, res) => {
  connection.query("SELECT * FROM users", (error, results) => {
    if (error) throw error;
    res.json(results);
  });
});

// app.delete("/users/:id", (req, res) => {
//   const userId = req.params.id;
//   connection.query(
//     "DELETE FROM users WHERE id = ?",
//     [userId],
//     (error, results) => {
//       if (error) throw error;
//       res.send("Pengguna telah dihapus");
//     }
//   );
// });

// for Emergency unit
app.post("/loginEU", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username and password are required" });
  }

  const query =
    "SELECT * FROM department_users WHERE username = ? AND password = ?";
  connection.query(query, [username, password], (error, results) => {
    if (error) {
      console.error("Error executing login query:", error);
      return res
        .status(500)
        .json({ error: "An error occurred while executing login query" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = results[0];
    console.log("berhasil login");
    return res.status(200).json({ message: "Login successful", user });
  });
});

app.post("/register_department", (req, res) => {
  const { full_name, username, password, department_name } = req.body;

  const checkUserQuery = `SELECT * FROM department_users WHERE username = ?`;
  connection.query(checkUserQuery, [username], (error, results) => {
    if (error) {
      console.error("Error checking user:", error);
      res.status(500).json({ error: "Internal server error" });
    } else if (results.length > 0) {
      res.status(400).json({ error: "Username already exists" });
    } else {
      const registerUserQuery = `INSERT INTO department_users (full_name, username, password, department_name) VALUES (?, ?, ?, ?)`;
      connection.query(
        registerUserQuery,
        [full_name, username, password, department_name],
        (error, results) => {
          if (error) {
            console.error("Error registering user:", error);
            res.status(500).json({ error: "Internal server error" });
          } else {
            res.status(200).json({ message: "User registered successfully" });
          }
        }
      );
    }
  });
});

app.get("/panggilan/:department", (req, res) => {
  const department = req.params.department;

  const query =
    "SELECT request_unit.*, users.name AS nama_pengguna FROM request_unit INNER JOIN users ON request_unit.user_id = users.user_id WHERE request_unit.unit = ? AND status IN ('Pending', 'Handled')";

  connection.query(query, [department], (error, results, fields) => {
    if (error) {
      console.error("Error retrieving data: ", error);
      res.status(500).json({ message: "Error retrieving data" });
    } else {
      res.json(results);
    }
  });
});

// Route to change call status
app.put("/calls/:report_id", (req, res) => {
  const reportId = req.params.report_id;
  const newStatus = req.body.status;

  const query = `UPDATE request_unit SET status = ? WHERE report_id = ?`;
  connection.query(query, [newStatus, reportId], (error, results) => {
    if (error) {
      res.status(500).json({ error: "fail to update status" });
    } else {
      res.status(200).json({
        message: "update status success",
        reportId,
        newStatus,
      });
    }
  });
});
