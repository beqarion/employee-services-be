const http = require("http");
const fs = require("fs");
const bcrypt = require("bcrypt");

const PORT = 3000;

function getUsers() {
  const data = fs.readFileSync("./employees.json");
  return JSON.parse(data);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject("Invalid JSON");
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // GET /users
  if (req.method === "GET" && req.url === "/users") {
    const users = getUsers();
    return res.end(JSON.stringify(users));
  }

  // GET /users/:id
  if (req.method === "GET" && req.url.startsWith("/users/")) {
    const id = req.url.split("/")[2];

    const users = getUsers();
    // bcrypt logic must added to get user

    const user = users.find((u) => u._id === id);

    if (!user) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ message: "User not found" }));
    }

    return res.end(
      JSON.stringify(user)
    );
  }

  // POST /sign-in
  if (req.method === "POST" && req.url === "/sign-in") {
    try {
      const body = await parseBody(req);
      const { username, password } = body;

      const users = getUsers();

      const user = users.find((u) => u.first_name === username);

      console.log();
      console.log(username, password);
      console.log();
      console.log(user);

      if (!user) {
        res.statusCode = 401;
        return res.end(
          JSON.stringify({ message: "Invalid username", body: {} })
        );
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ message: "Wrong password", body: {} }));
      }

      return res.end(
        JSON.stringify({ message: "Sign-in successful", body: user })
      );
    } catch (error) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ message: error, body: {} }));
    }
  }

  // fallback
  res.statusCode = 404;
  res.end(JSON.stringify({ message: 'Not found"' }));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
