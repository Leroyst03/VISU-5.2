const EntryDatabase = require("../models/DataBaseEntryGui");
const Conversiones = require("../models/Conversiones");

const entryDb = new EntryDatabase();
const conversiones = new Conversiones();

exports.getInputs = (req, res) => {
  entryDb.db.get("SELECT * FROM entry_gui WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const bits = conversiones.obtenerBitsEntrada(row, "Inputs", 14);
    res.json(bits);
  });
};

exports.getOutputs = (req, res) => {
    entryDb.db.get("SELECT * FROM entry_gui WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
       
        const bits = conversiones.obtenerBitsSalida(row, "Outputs", 4);
        res.json(bits);
    });
};
