const sqlite3 = require('sqlite3').verbose();

class DataBaseOutGui {
    constructor(rutaDb = "./dataBaseOutGui.db") {
        this.db = new sqlite3.Database(rutaDb, (err) => {
        if (err) {
            console.error("❌ Error al conectar con la base de datos:", err.message);
        } else {
            console.log("✅ Conectado a la base de datos OutGui.");
        }
        });
    }

    // Crear tabla out_gui
    initOutGui() {
        const sql = `
        CREATE TABLE IF NOT EXISTS out_gui (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_agvs INTEGER DEFAULT 0,
            out_botones INTEGER DEFAULT 0
        );
        `;
        this.db.run(sql, (err) => {
            if (err) console.error("Error al crear out_gui:", err.message);
            else {
                console.log("Tabla out_gui lista.");
                this.insertDefaultRow();
            }
        });
    }

    // Insertar fila inicial si está vacía
    insertDefaultRow() {
        this.db.get("SELECT COUNT(*) as count FROM out_gui", (err, row) => {
            if (row && row.count === 0) {
                this.db.run(
                "INSERT INTO out_gui (numero_agvs, out_botones) VALUES (0, 0)",
                (err) => {
                    if (err) console.error("Error al insertar fila inicial:", err.message);
                    else console.log("Fila inicial insertada en out_gui.");
                }
                );
            }
        });
    }

    // Actualizar numero_agvs
    updateNumeroAgvs(nuevoValor, id = 1) {
        this.db.run(
            "UPDATE out_gui SET numero_agvs = ? WHERE id = ?",
            [nuevoValor, id],
            function (err) {
                if (err) console.error("Error al actualizar numero_agvs:", err.message);
                else console.log(`✔ numero_agvs actualizado (${this.changes} fila)`);
            }
        );
    }

    // Actualizar out_botones
    updateOutBotones(nuevoValor, id = 1) {
        this.db.run(
            "UPDATE out_gui SET out_botones = ? WHERE id = ?",
            [nuevoValor, id],
            function (err) {
                if (err) console.error("Error al actualizar out_botones:", err.message);
                else console.log(`✔ out_botones actualizado (${this.changes} fila)`);
            }
        );
    }

    // Leer numero_agvs
    getNumeroAgvs(callback) {
        this.db.get("SELECT numero_agvs FROM out_gui WHERE id = 1", [], (err, row) => {
            if (err) {
                console.error("Error al leer numero_agvs:", err.message);
                callback(0);
            } else {
                callback(row.numero_agvs);
            }
        });
    }

    // Leer out_botones
    getOutBotones(callback) {
        this.db.get("SELECT out_botones FROM out_gui WHERE id = 1", [], (err, row) => {
            if (err) {
                console.error("Error al leer numero_botones:", err.message);
                callback(0);
            } else {
                callback(row.out_botones);
            }
        });
    }
}

module.exports = DataBaseOutGui;
