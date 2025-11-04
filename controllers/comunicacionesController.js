const EntryDatabase = require("../models/DataBaseEntryGui");
const entryDb = new EntryDatabase();

// Endpoint: /api/com
// Devuelve si hay comunicación activa (1) o no (0)
exports.getCom = (req, res) => {
    entryDb.db.get("SELECT COM FROM entry_gui WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({ COM: row.COM });
    });
};

// Endpoint: /api/estado_comunicaciones
// Devuelve el estado del PLC y de los AGVs
exports.getEstadoComunicaciones = (req, res) => {
    entryDb.db.get("SELECT * FROM entry_gui WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        // Estado del PLC (usamos COM como referencia)
        const plc = row.COM;

        // Estados de cada AGV (usamos COM_AGVn)
        const agvs = [];
        Object.keys(row).forEach((col) => {
            if (col.startsWith("COM_AGV")) {
                const index = col.replace("COM_AGV", "");
                agvs.push({ id: `agv-${index}`, status: row[col] });
            }
        });

        res.json({ plc, agvs });
    });
};