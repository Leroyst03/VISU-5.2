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
                const posiciones = [
                    {x: 30.0, y: 15.0},
                    {x: 30.0, y: 18.0},
                    {x: 30.0, y: 24.0}
                ];
                
                const orden = this.db.prepare("INSERT INTO semaforos (X, Y) VALUES (?, ?)");

                posiciones.forEach(i => {
                    orden.run([i.x, i.y], err => {
                        if (err) {
                            console.error("Error al insertar semaforo: ", err.message);
                        }
                    });
                });
               
                orden.finalize((err2) => {
                    if (err2) {
                        console.error("Error finalizando inserciones: ", err2.message);
                    }
                    else console.log("✔ Semáforos iniciales insertados.");
                });

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
}

module.exports = DataBaseSemaforos;
