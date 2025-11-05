const EntryDatabase = require("../models/DataBaseEntryGui");
const Conversiones = require("../models/Conversiones");

const entryDb = new EntryDatabase();
const conversiones = new Conversiones();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado a IO");

    // Evento: cliente pide entradas
    socket.on("get_inputs", () => {
      entryDb.db.get("SELECT * FROM entry_gui WHERE id = 1", (err, row) => {
        if (!err && row) {
          const bits = conversiones.obtenerBitsEntrada(row, "Inputs", 14);
          socket.emit("inputs_data", bits);
        }
      });
    });

    // Evento: cliente pide salidas
    socket.on("get_outputs", () => {
      entryDb.db.get("SELECT * FROM entry_gui WHERE id = 1", (err, row) => {
        if (!err && row) {
          const bits = conversiones.obtenerBitsSalida(row, "Outputs", 8);
          socket.emit("outputs_data", bits);
        }
      });
    });
  });
};
