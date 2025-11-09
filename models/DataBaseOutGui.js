const sqlite3 = require('sqlite3').verbose();

class DataBaseOutGui {
  constructor(rutaDb = "./dataBaseOutGui.db") {
    console.log("Conectando a DB OutGui en:", rutaDb);
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
        botones_out INTEGER DEFAULT 0
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
      if (err) {
        console.error("Error comprobando filas out_gui:", err.message);
        return;
      }
      if (row && row.count === 0) {
        this.db.run(
          "INSERT INTO out_gui (numero_agvs, botones_out) VALUES (0, 0)",
          (err2) => {
            if (err2) console.error("Error al insertar fila inicial:", err2.message);
            else console.log("Fila inicial insertada en out_gui.");
          }
        );
      }
    });
  }

  // Actualizar numero_agvs
  updateNumeroAgvs(nuevoValor, id = 1, cb = () => {}) {
    this.db.run(
      "UPDATE out_gui SET numero_agvs = ? WHERE id = ?",
      [nuevoValor, id],
      function (err) {
        if (err) {
          console.error("Error al actualizar numero_agvs:", err.message);
          return cb(err);
        }
        console.log(`✔ numero_agvs actualizado (${this.changes} fila)`);
        if (this.changes === 0) return cb(new Error("No rows updated (id=1 missing?)"));
        cb(null, this.changes);
      }
    );
  }

  // Actualizar botones_out (no recomendado para operaciones concurrentes)
  updateBotonesOut(nuevoValor, id = 1, cb = () => {}) {
    this.db.run(
      "UPDATE out_gui SET botones_out = ? WHERE id = ?",
      [nuevoValor, id],
      function (err) {
        if (err) {
          console.error("Error al actualizar botones_out:", err.message);
          return cb(err);
        }
        console.log(`✔ botones_out actualizado (${this.changes} fila)`);
        if (this.changes === 0) return cb(new Error("No rows updated (id=1 missing?)"));
        cb(null, this.changes);
      }
    );
  }

  // Leer numero_agvs
  getNumeroAgvs(cb) {
    this.db.get("SELECT numero_agvs FROM out_gui WHERE id = 1", [], (err, row) => {
      if (err) {
        console.error("Error al leer numero_agvs:", err.message);
        return cb(err);
      }
      cb(null, Number(row?.numero_agvs || 0));
    });
  }

  // Leer botones_out (corregido)
  getOutBotones(cb) {
    this.db.get("SELECT botones_out FROM out_gui WHERE id = 1", [], (err, row) => {
      if (err) {
        console.error("Error al leer botones_out:", err.message);
        return cb(err);
      }
      if (!row) return cb(new Error("Fila id=1 no encontrada en out_gui"));
      cb(null, Number(row.botones_out || 0));
    });
  }

  // Operación atómica: OR bitwise para encender bits sin duplicados
  atomicOrBotonesOut(mask, exponente, cb) {
    const exponentes = new Set();
   
    // Si el exponente x ya lo hemos sumado no aplicamos ninguna operacion, de lo contrario lo registramos en el set
    if (exponentes.has(exponente)) {
      return ; 
      
    }

    exponentes.add(exponente);
 
    const sql = "UPDATE out_gui SET botones_out = COALESCE(botones_out,0) | ? WHERE id = 1";
    this.db.run(sql, [mask], function (err) {
      if (err) {
        console.error("Error atomicOrBotonesOut UPDATE:", err.message);
        return cb(err);
      }

      if (this.changes === 0) return cb(new Error("No rows updated (id=1 missing?)"));
      // leer nuevo valor

      this.db.get("SELECT botones_out FROM out_gui WHERE id = 1", (err2, row) => {
        if (err2) return cb(err2);
       
        cb(null, Number(row?.botones_out || 0));
      });
    }.bind(this));
  }

  // Reset atómico de botones_out a 0
    resetBotonesOut(cb) {
       const sql = "UPDATE out_gui SET botones_out = 0 WHERE id = 1";
        this.db.run(sql, [], function (err) {
        if (err) {
            console.error("Error resetBotonesOut UPDATE:", err.message);
            return cb(err);
        }
        if (this.changes === 0) return cb(new Error("No rows updated (id=1 missing?)"));
        cb(null, 0);
        }.bind(this));
    }
}

module.exports = DataBaseOutGui;
