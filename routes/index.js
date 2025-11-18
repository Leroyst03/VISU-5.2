const express = require("express");
const router = express.Router();

const agvController = require("../controllers/agvController");
const semaforoController = require("../controllers/semaforoController");
const ordenesController = require("../controllers/ordenesController");
const ioController = require("../controllers/ioController");
const mensajeController = require("../controllers/mensajeController");
const comunicacionesController = require("../controllers/comunicacionesController");
const enviromentController = require("../controllers/EnviromentController");

// Endpoints REST que usa el frontend
router.get("/punto_agv", agvController.getAgvs);
router.get("/punto_semaforo", semaforoController.getSemaforos);
router.get("/ordenes", ordenesController.getOrdenes);

// Entradas y salidas desde entry_gui
router.get("/inputs", ioController.getInputs);
router.get("/outputs", ioController.getOutputs);

// Mensajes y comunicaciones
router.get("/mensaje", mensajeController.getMensaje);
router.get("/com", comunicacionesController.getCom);
router.get("/estado_comunicaciones", comunicacionesController.getEstadoComunicaciones);

// Variables globales para el front
router.get("/variables", enviromentController.getVariables);

module.exports = router;
