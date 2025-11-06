const express = require("express");
const routes = require("./routes");
const path = require("path");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

// Modelos de base de datos
const DataBaseEntryGui = require("./models/DataBaseEntryGui");
const DataBaseOrdenes = require("./models/DataBaseOrdenes");
const DataBaseSemaforos = require("./models/DataBaseSemaforos");
const DataBaseOutGui = require("./models/DataBaseOutGui");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

// Inicializar bases de datos
const entryDb = new DataBaseEntryGui();
entryDb.initEntryGui();

const ordenesDb = new DataBaseOrdenes();
ordenesDb.initOrdenes();

const semaforosDb = new DataBaseSemaforos();
semaforosDb.initSemaforos();

const outGuiDb = new DataBaseOutGui();
outGuiDb.initOutGui();

// Middleware
app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use("/api", routes);

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "index.html"));
});

// Enganchar controladores de sockets
require("./controllers/ioSocketController")(io);   // para entradas/salidas en tiempo real
require("./controllers/botonesController")(io);   //  para botones/LEDs en tiempo real

// Arrancar servidor
server.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
