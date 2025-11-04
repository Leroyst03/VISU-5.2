const express = require("express");
const routes = require("./routes");
const path = require("path");
require("dotenv").config();

const DataBaseEntryGui = require("./models/DataBaseEntryGui");
const DataBaseOrdenes = require("./models/DataBaseOrdenes");
const DataBaseSemaforos = require("./models/DataBaseSemaforos");
const DataBaseOutGui = require("./models/DataBaseOutGui");

const app = express();
const port = process.env.PORT || 3000;

// Inicializar bases de datos y tablas
const entryDb = new DataBaseEntryGui();
entryDb.initEntryGui();   // crea entry_gui con fila por defecto

const ordenesDb = new DataBaseOrdenes();
ordenesDb.initOrdenes();  // crea tabla ordenes

const semaforosDb = new DataBaseSemaforos();
semaforosDb.initSemaforos(); // crea tabla semaforos

const outGuiDb = new DataBaseOutGui();
outGuiDb.initOutGui();    // crea tabla out_gui

// Middleware
app.use(express.json());

// Servir estáticos
app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/scripts", express.static(path.join(__dirname, "scripts")));

// Rutas API
app.use("/api", routes);

// Ruta principal → servir index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
