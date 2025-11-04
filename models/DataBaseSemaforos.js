const sqlite3 = require('sqlite3').verbose();

class DataBaseSemaforos {
    constructor(rutaDb = "./dataBaseSemaforos.db") {
        // Crea una instancia de la base de datos
        this.db = new sqlite3.Database(rutaDb, (err) => {
            if (err) {
                console.error("❌ Error al conectar con la base de datos:", err.message);
            } else {
                console.log("✅ Conectado a la base de datos Semaforos.");
            }
        });
    }

    // Crear tabla semaforos
    initSemaforos() {
        const sql = `
        CREATE TABLE IF NOT EXISTS semaforos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            X REAL DEFAULT 30.0,
            Y REAL DEFAULT 15.0
        );`;
        
        this.db.run(sql, (err) => {
            if (err) console.error("Error al crear tabla semaforos:", err.message);
            else {
                console.log("Tabla semaforos lista.");
                this.insertDefaultRow();
            }
        });
    }

    // Insertar fila inicial si la tabla está vacía
    insertDefaultRow() {
        this.db.get("SELECT COUNT(*) as count FROM semaforos", (err, row) => {
            if (row && row.count === 0) {
                this.db.run(
                    "INSERT INTO semaforos (X, Y) VALUES (?, ?)",
                    [30.0, 15.0],
                    (err) => {
                        if (err) console.error("Error al insertar semáforo inicial:", err.message);
                        else console.log("✔ Semáforo inicial insertado.");
                    }
                );
            }
        });
    }

    // Obtener todos los semáforos
    getSemaforos(callback) {
        this.db.all("SELECT * FROM semaforos", [], (err, rows) => {
            if (err) {
                console.error("Error al obtener los semáforos:", err.message);
                callback([]);
            } else {
                callback(rows);
            }
        });
    }

    // Obtener un semáforo por ID
    getSemaforoById(id, callback) {
        this.db.get("SELECT * FROM semaforos WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error("Error al obtener semáforo:", err.message);
                callback(null);
            } else {
                callback(row);
            }
        });
    }

    // Insertar un nuevo semáforo
    addSemaforo(x, y, callback) {
        this.db.run(
            "INSERT INTO semaforos (X, Y) VALUES (?, ?)",
            [x, y],
            function (err) {
                if (err) {
                    console.error("Error al insertar semáforo:", err.message);
                    callback(null);
                } else {
                    console.log("✔ Semáforo insertado con id", this.lastID);
                    callback(this.lastID);
                }
            }
        );
    }

    // Actualizar un semáforo existente
    updateSemaforo(id, nuevoX, nuevoY) {
        this.db.run(
            "UPDATE semaforos SET X = ?, Y = ? WHERE id = ?",
            [nuevoX, nuevoY, id],
            function (err) {
                if (err) console.error("Error al actualizar semáforo:", err.message);
                else console.log(`✔ Semáforo ${id} actualizado (${this.changes} fila)`);
            }
        );
    }
}

module.exports = DataBaseSemaforos;
