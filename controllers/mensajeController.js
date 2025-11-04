const EntryDatabase = require("../models/DataBaseEntryGui");
const Conversiones = require("../models/Conversiones");

const entryDb = new EntryDatabase();
const conversiones = new Conversiones();

exports.getMensaje = (req, res) => {
    entryDb.db.all("SELECT * FROM entry_gui", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
       
        const mensaje = conversiones.obtenerMensaje(rows);
        res.json({ mensaje });
    });
};
