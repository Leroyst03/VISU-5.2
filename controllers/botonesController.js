const DataBaseOutGui = require("../models/DataBaseOutGui");
const DataBaseEntryGui = require("../models/DataBaseEntryGui");
const Conversiones = require("../models/Conversiones");

const outDb = new DataBaseOutGui();
const entryDb = new DataBaseEntryGui();
const conversiones = new Conversiones();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado a botones");

    // Estado inicial de los LEDs
    outDb.getOutBotones((valorActual) => {
      const bits = conversiones.numeroParaBits(valorActual, 8); // ahora 8 bits
      const colores = bits.map(b => b ? "verde" : "rojo");
      socket.emit("update_led_color_outputs", colores);
    });

    // Evento cuando se pulsa un botón
    socket.on("boton_pulsado", (data) => {
      const index = parseInt(data.index);

      // Consultamos Botones_in en entry_gui
      entryDb.db.get("SELECT Botones_in FROM entry_gui WHERE id = 1", (err, row) => {
        if (err) {
          console.error("❌ Error al leer Botones_in:", err.message);
          return;
        }

        const botonIn = row ? row.Botones_in : 0;

        if (botonIn !== 0) {
          // Resetear todos los botones
          outDb.updateOutBotones(0);
          const colores = Array(8).fill("rojo");
          io.emit("update_led_color_outputs", colores);
        } else {
          // Toggle normal
          outDb.getOutBotones((valorActual) => {
            const nuevoValor = valorActual ^ (1 << index); // XOR para hacer toggle
            outDb.updateOutBotones(nuevoValor);

            const bits = conversiones.numeroParaBits(nuevoValor, 8);
            const colores = bits.map(b => b ? "verde" : "rojo");
            io.emit("update_led_color_outputs", colores);
          });
        }
      });
    });
  });
};
