const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const numAgvs = parseInt(process.env.AGVS, 10) || 0;

class EntryDatabase {
    constructor(rutaDb = "./dataBaseEntryGui.db") {
        this.db = new sqlite3.Database(rutaDb, (err) => {
            if (err) {
                console.error("❌ Error al conectar con la base de datos:", err.message);
            } else {
                console.log("✅ Conectado a la base de datos EntryGui.");
            }
        });
    }

    initEntryGui() {
        const columns = [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "COM INTEGER DEFAULT 1",
            "Inputs INTEGER DEFAULT 1",
            "Outputs INTEGER DEFAULT 3",
            "Mensajes TEXT DEFAULT 'Mensaje de ejemplo'",
            "Botones_in INTEGER DEFAULT 0",
            "Semaforo INTEGER DEFAULT 1"
        ];

        for (let i = 1; i <= numAgvs; i++) {
            columns.push(`COM_AGV${i} INTEGER DEFAULT 0`);
            columns.push(`X_AGV${i} REAL DEFAULT 1.0`);
            columns.push(`Y_AGV${i} REAL DEFAULT 1.0`);
            columns.push(`A_AGV${i} REAL DEFAULT 1.0`);
        }

        const sql = `CREATE TABLE IF NOT EXISTS entry_gui (${columns.join(", ")});`;
        this.db.run(sql, (err) => {
        if (err) console.error("Error al crear entry_gui:", err.message);
        else {
            console.log("Tabla entry_gui lista.");
            this.insertDefaultRow(numAgvs);
        }
        });
    }

    insertDefaultRow(numAgvs) {
        this.db.get("SELECT COUNT(*) as count FROM entry_gui", (err, row) => {
        if (row.count === 0) {
            const cols = ["COM"];
            const placeholders = ["?"];
            const values = [1];

            for (let i = 1; i <= numAgvs; i++) {
                cols.push(`COM_AGV${i}`, `X_AGV${i}`, `Y_AGV${i}`, `A_AGV${i}`);
                placeholders.push("?", "?", "?", "?");
                values.push(0, 5.0, 10.0, 270.0);
            }

            cols.push("Inputs", "Outputs", "Mensajes", "Botones_in", "Semaforo");
            placeholders.push("?", "?", "?", "?", "?");
            values.push(1, 3, "Prueba", 0, 1);

            const sql = `INSERT INTO entry_gui (${cols.join(", ")}) VALUES (${placeholders.join(", ")});`;

            this.db.run(sql, values, (err) => {
                if (err) console.error("Error al insertar fila inicial:", err.message);
                else console.log("Fila inicial insertada en entry_gui.");
            });
        }
        });
    }

    getBotonesIn(cb) {
        const sql = `SELECT Botones_in FROM entry_gui WHERE id = 1`;
        this.db.get(sql, [], (err, row) => {
            if (err) {
                console.error("Error al leer botones_in:", err.message);
                return cb(err);
            }
            if (!row) {
                return cb(new Error("Fila id=1 no encontrada en entry_gui"));
            }
            cb(null, Number(row.Botones_in || 0));
        });
    }


    getAgvPositions(numAgvs, callback) {
        const campos = [];
        for (let i = 1; i <= numAgvs; i++) {
            campos.push(`COM_AGV${i}`, `X_AGV${i}`, `Y_AGV${i}`, `A_AGV${i}`);
        }

        const sql = `SELECT ${campos.join(", ")} FROM entry_gui WHERE id = 1`;

        this.db.get(sql, [], (err, row) => {
            if (err) {
                console.error("Error al leer posiciones:", err.message);
                callback([]);
            } else {
                const posiciones = [];
                for (let i = 1; i <= numAgvs; i++) {
                    posiciones.push({
                        id: `AGV-${i}`,
                        x: row[`X_AGV${i}`],
                        y: row[`Y_AGV${i}`],
                        angle: row[`A_AGV${i}`],
                        status: row[`COM_AGV${i}`] 
                    });
                }
                //console.log("Estados y posiciones de AGVs:", posiciones);
                callback(posiciones);
            }
        });
    }
}

module.exports = EntryDatabase;
