const EntryDatabase = require("../models/DataBaseEntryGui");
const DataBaseSemaforos = require("../models/DataBaseSemaforos");
const Conversiones = require("../models/Conversiones");

const entryDb = new EntryDatabase();
const semaforosDb = new DataBaseSemaforos();
const conversiones = new Conversiones();

exports.getSemaforos = (req, res) => {
    semaforosDb.getSemaforos((rows) => {
        entryDb.db.get("SELECT * FROM entry_gui WHERE id = 1", (err, entryRow) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const elementos = conversiones.obtenerSemaforos(entryRow, rows);
            res.json(elementos);
        });
    });
};
