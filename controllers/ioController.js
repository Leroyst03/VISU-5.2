const EntryDatabase = require("../models/DataBaseEntryGui");
const Conversiones = require("../models/Conversiones");
require('dotenv').config();

const entryDb = new EntryDatabase();
const conversiones = new Conversiones();
const numInputs = process.env.INPUTS || 8;
const numOutputs = process.env.OUTPUTS || 8;

exports.getInputs = (req, res) => {
  entryDb.db.get("SELECT * FROM entry_gui WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const bits = conversiones.obtenerBitsEntrada(row, "Inputs", numInputs);
    res.json(bits);
  });
};

exports.getOutputs = (req, res) => {
  entryDb.db.get("SELECT * FROM entry_gui WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const bits = conversiones.obtenerBitsSalida(row, "Outputs", numOutputs);
    res.json(bits);
  });
};
