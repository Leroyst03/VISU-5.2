const sqlite3 = require('sqlite3').verbose();
const EntryDatabase = require('./DataBaseEntryGui');

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

    this.entryDb = new EntryDatabase();

    // Se resetea automáticamente cada 500 ms, pero solo si botones_in > 0
    setInterval(() => {
      this.entryDb.getBotonesIn((err, botonesIn) => {
        if (err) {
          console.error("Error leyendo botones_in:", err.message);
          return;
        }

        if (botonesIn > 0) {
          this.resetBotonesOut((err) => {
            if (err) {
              console.error("Error en reset periódico:", err.message);
            } else {
              console.log("Botones_out reseteados automáticamente 0.");
            }
          });
        }
      });
    }, 500);
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

  // Leer botones_out
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

  // actualizar numero_agvs
  updateNumAgvs(num, cb) {
    const sql = "UPDATE out_gui SET numero_agvs = ? WHERE id = 1";
    this.db.run(sql, [num], function (err) {
      if (err) {
        console.error("Error al actualizar el numero de agvs: ", err.message);
        return cb(err);
      }
      if (this.changes === 0) return cb(new Error("No rows updated (id=1 missing?)"));
      cb(null, num);
    });
  }


  // Operación atómica: OR bitwise
  atomicOrBotonesOut(mask, cb) {
    const sql = "UPDATE out_gui SET botones_out = COALESCE(botones_out,0) | ? WHERE id = 1";
    this.db.run(sql, [mask], function (err) {
      if (err) {
        console.error("Error atomicOrBotonesOut UPDATE:", err.message);
        return cb(err);
      }
      if (this.changes === 0) return cb(new Error("No rows updated (id=1 missing?)"));

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
