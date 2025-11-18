const DataBaseOutGui = require("../models/DataBaseOutGui");
const outDb = new DataBaseOutGui();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado a numero_agvs");

    // Emitir estado inicial
    outDb.db.get("SELECT numero_agvs FROM out_gui WHERE id = 1", (err, row) => {
      if (!err && row) {
        socket.emit("numero_agvs_actualizado", { numero_agvs: Number(row.numero_agvs || 0) });
      }
    });

    // Escuchar actualizaciones desde el frontend
    socket.on("contador_actualizado", (data) => {
      const nuevoValor = Number.parseInt(data.numero_agvs, 10);

      if (!Number.isInteger(nuevoValor) || nuevoValor < 0) {
        socket.emit("numero_agvs_error", { error: "Valor inválido para numero_agvs" });
        return;
      }

      outDb.updateNumAgvs(nuevoValor, (err) => {
        if (err) {
          socket.emit("numero_agvs_error", { error: err.message });
          return;
        }
        console.log("✔ numero_agvs actualizado:", nuevoValor);
        io.emit("numero_agvs_actualizado", { numero_agvs: nuevoValor });
      });
    });
  });
};
