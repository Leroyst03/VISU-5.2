const sqlite3 = require('sqlite3').verbose();

class DataBaseOrdenes {
    constructor(rutaDb = "./dataBaseOrdenes.db") {
        this.db = new sqlite3.Database(rutaDb, (err) => {
            if (err) {
                console.error("❌ Error al conectar con la base de datos:", err.message);
            } else {
                console.log("✅ Conectado a la base de datos Ordenes.");
            }
        });
    }

    // Crear tabla ordenes
    initOrdenes() {
        const sql = `
        CREATE TABLE IF NOT EXISTS ordenes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            origen TEXT,
            destino TEXT
        );
        `;
        this.db.run(sql, (err) => {
            if (err) console.error("Error al crear ordenes:", err.message);
            else {
                console.log("Tabla ordenes lista.");
                this.insertDefaultRows();
            }
        });
    }

    // Insertar filas iniciales si está vacía
    insertDefaultRows() {
        this.db.get("SELECT COUNT(*) as count FROM ordenes", (err, row) => {
            if (row && row.count === 0) {
                const defaults = [
                ["Origen A", "Destino A"],
                ["Origen B", "Destino B"],
                ["Origen C", "Destino C"]
                ];
                defaults.forEach(([origen, destino]) => {
                    this.db.run(
                        "INSERT INTO ordenes (origen, destino) VALUES (?, ?)",
                        [origen, destino],
                        (err) => {
                        if (err) console.error("Error al insertar orden:", err.message);
                        }
                    );
                });
                console.log("Órdenes iniciales insertadas.");
            }
        });
    }

    // Leer todas las órdenes
    getOrdenes(callback) {
        this.db.all("SELECT * FROM ordenes", [], (err, rows) => {
            if (err) {
                console.error("Error al leer ordenes:", err.message);
                callback([]);
            } else {
                callback(rows);
            }
        });
    }

    // Insertar una nueva orden
    addOrden(origen, destino) {
        this.db.run(
            "INSERT INTO ordenes (origen, destino) VALUES (?, ?)",
            [origen, destino],
            function (err) {
                if (err) console.error("Error al insertar orden:", err.message);
                else console.log(`✔ Orden añadida con id ${this.lastID}`);
            }
        );
    }

    // Actualizar una orden existente
    updateOrden(id, nuevoOrigen, nuevoDestino) {
        this.db.run(
            "UPDATE ordenes SET origen = ?, destino = ? WHERE id = ?",
            [nuevoOrigen, nuevoDestino, id],
            function (err) {
                if (err) console.error("Error al actualizar orden:", err.message);
                else console.log(`✔ Orden con id ${id} actualizada (${this.changes} fila)`);
            }
        );
    }

    // Eliminar una orden
    deleteOrden(id) {
        this.db.run("DELETE FROM ordenes WHERE id = ?", [id], function (err) {
            if (err) console.error("Error al eliminar orden:", err.message);
            else console.log(`✔ Orden con id ${id} eliminada (${this.changes} fila)`);
        });
    }
}

module.exports = DataBaseOrdenes;
