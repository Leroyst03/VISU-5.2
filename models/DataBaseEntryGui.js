const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

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

    // Crear tabla entry_gui con columnas dinámicas
    initEntryGui(numAgvs = (process.env.AGVS || 5)) {
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

    // Insertar fila inicial si la tabla está vacía
    insertDefaultRow(numAgvs) {
        this.db.get("SELECT COUNT(*) as count FROM entry_gui", (err, row) => {
        if (row.count === 0) {
            // Construir lista de columnas dinámicas
            const cols = ["COM"];
            const placeholders = ["?"];
            const values = [1];

            for (let i = 1; i <= numAgvs; i++) {
                cols.push(`COM_AGV${i}`, `X_AGV${i}`, `Y_AGV${i}`, `A_AGV${i}`);
                placeholders.push("?", "?", "?", "?");
                values.push(0, 80.0, 150.0, 270.0);
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

    // Actualizar Mensajes
    updateMensajes(nuevoMensaje, id = 1) {
        this.db.run(
        "UPDATE entry_gui SET Mensajes = ? WHERE id = ?",
        [nuevoMensaje, id],
            function (err) {
                if (err) console.error("Error al actualizar Mensajes:", err.message);
                else console.log(`✔ Mensajes actualizado (${this.changes} fila)`);
            }
        );
    }

    // Actualizar Botones_in
    updateBotonesIn(nuevoValor, id = 1) {
        this.db.run(
        "UPDATE entry_gui SET Botones_in = ? WHERE id = ?",
        [nuevoValor, id],
            function (err) {
                if (err) console.error("Error al actualizar Botones_in:", err.message);
                else console.log(`✔ Botones_in actualizado (${this.changes} fila)`);
            }
        );
    }

  // Leer posiciones de AGVs
  getAgvPositions(numAgvs, callback) {
    const campos = [];
    for(let i = 1; i <= numAgvs; i++) {
        campos.push(`X_AGV${i}`, `Y_AGV${i}`, `A_AGV${i}`);
    }
    
    const sql = `SELECT ${campos.join(", ")} FROM entry_gui WHERE id = 1`;
    
    this.db.get(sql, [], (err, row) => {
        if(err) {
            console.error("Error al leer posiciones:", err.message);
            callback([]);
        } else {
            const posiciones = [];
            for(let i = 1; i <= numAgvs; i++) {
                posiciones.push({
                    id: `AGV-${i}`,
                    x: row[`X_AGV${i}`],
                    y: row[`Y_AGV${i}`],
                    angle: row[`A_AGV${i}`]
                });
            }
            callback(posiciones);
        }
    });
  }
}

module.exports = EntryDatabase;