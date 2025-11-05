const express = require("express");
const router = express.Router();

const agvController = require("../controllers/agvController");
const semaforoController = require("../controllers/semaforoController");
const ordenesController = require("../controllers/ordenesController");
const ioController = require("../controllers/ioController");
const mensajeController = require("../controllers/mensajeController");
const comunicacionesController = require("../controllers/comunicacionesController");

const DataBaseOutGui = require("../models/DataBaseOutGui");
const Conversiones = require("../models/Conversiones");
const outDb = new DataBaseOutGui();
const conversiones = new Conversiones();

// Endpoints REST
router.get("/punto_agv", agvController.getAgvs);
router.get("/punto_semaforo", semaforoController.getSemaforos);
router.get("/ordenes", ordenesController.getOrdenes);
router.get("/inputs", ioController.getInputs);
router.get("/outputs", ioController.getOutputs);
router.get("/mensaje", mensajeController.getMensaje);
router.get("/com", comunicacionesController.getCom);
router.get("/estado_comunicaciones", comunicacionesController.getEstadoComunicaciones);

// Endpoint para botones
router.get("/botones", (req, res) => {
  outDb.getOutBotones((valor) => {
    const bits = conversiones.numeroParaBits(valor, 8);
    res.json(bits);
  });
});

module.exports = router;
