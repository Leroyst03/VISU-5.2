const DataBaseOutGui = require("../models/DataBaseOutGui");
const DataBaseEntryGui = require("../models/DataBaseEntryGui");

const outDb = new DataBaseOutGui();
const entryDb = new DataBaseEntryGui();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado a botones");

    // (Opcional) emitir estado inicial de Botones_out para depuración
    outDb.getOutBotones((errInit, valInit) => {
      if (!errInit) {
        socket.emit("botones_out_actualizado", { botones_out: Number(valInit || 0) });
      }
    });

    socket.on("boton_pulsado", (data) => {
      const x = Number.parseInt(data.index, 10);
      if (!Number.isInteger(x) || x < 0) {
        socket.emit("botones_out_error", { error: "Índice de botón inválido" });
        return;
      }

      // Leer Botones_in de forma segura
      entryDb.db.get("SELECT Botones_in FROM entry_gui WHERE id = 1", (err, row) => {
        if (err) {
          console.error("❌ Error al leer Botones_in:", err.message);
          socket.emit("botones_out_error", { error: err.message });
          return;
        }

        const botonesIn = Number(row?.Botones_in || 0);

        if (botonesIn !== 0) {
          // Reset atómico en DataBaseOutGui
          outDb.resetBotonesOut((errReset, nuevoVal) => {
            if (errReset) {
              console.error("❌ Error al reiniciar Botones_out:", errReset.message);
              socket.emit("botones_out_error", { error: errReset.message });
              return;
            }
            console.log("✔ Botones_out reseteado a 0");
            socket.emit("botones_out_actualizado", { botones_out: Number(nuevoVal || 0) });
          });
        } else {
          // Aplicar OR atómico (encender el bit x sin duplicados)
          const mask = 1 << x; // si los índices son 1-based usa (1 << (x - 1))

          outDb.atomicOrBotonesOut(mask, (errOr, nuevoValor) => {
            if (errOr) {
              console.error("❌ Error al actualizar Botones_out:", errOr.message);
              socket.emit("botones_out_error", { error: errOr.message });
              return;
            }
            console.log("✔ Botones_out actualizado:", nuevoValor);
            socket.emit("botones_out_actualizado", { botones_out: Number(nuevoValor || 0) });
          });
        }
      });
    });
  });
};
