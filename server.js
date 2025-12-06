const http = require("http");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { log } = require("console");

const PORT = process.env.PORT || 3000;

function getUsers() {
  const data = fs.readFileSync("./users.json");
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
  res.setHeader("Access-control-Allow-Origin", "*");

  if (req.method === "GET" && req.url === "/users") {
    const users = getUsers().map((u) => ({
      id: u.id,
      name: u.name,
      password: u.password,
    }));
    console.log(users);
    return res.end(JSON.stringify(users));
  }

  // GET /users/:id
  if (req.method === "GET" && req.url.startsWith("/users/")) {
    const id = req.url.split("/")[2];

    const users = getUsers();
    // bcrypt logic must added to get user

    const user = users.find((u) => +u.id === +id);

    if (!user) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ message: "User not found" }));
    }

    return res.end(
      JSON.stringify({
        id: user.id,
        name: user.name,
        password: user.password,
      })
    );
  }

  // POST /sign-in
  if (req.method === "POST" && req.url === "/sign-in") {
    try {
      const body = await parseBody(req);
      const { username, password } = body;

      const users = getUsers();

      const user = users.find((u) => u.username === username);

      console.log();
      console.log(username, password);
      console.log();
      console.log(user);

      if (!user) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ message: "Invalid username" }));
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ message: "Wrong password" }));
      }

      return res.end(JSON.stringify({ message: "Sign-in successful" }));
    } catch (error) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ message: error }));
    }
  }

  // fallback
  res.statusCode = 404;
  res.end(JSON.stringify({ message: 'Not found"' }));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
