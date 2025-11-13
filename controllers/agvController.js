const EntryDatabase = require("../models/DataBaseEntryGui");
const Conversiones = require("../models/Conversiones");

const entryDb = new EntryDatabase();
const conversiones = new Conversiones();

exports.getAgvs = (req, res) => {
  entryDb.db.get("SELECT * FROM entry_gui WHERE id = 1", (err, entryRow) => {
    if (err) return res.status(500).json({ error: err.message });

    const elementos = conversiones.obtenerAgvs(entryRow);
    res.json(elementos);
  });
};
