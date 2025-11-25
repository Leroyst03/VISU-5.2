require('dotenv').config();
const { imageSize } = require("image-size");
const fs = require("fs");
const path = require("path");

class Conversiones {
    constructor() {
        // Ruta absoluta al archivo en disco
        const rutaImagen = path.resolve(__dirname, "../static/images/mapa.png");

        // Leer el archivo como Buffer
        const buffer = fs.readFileSync(rutaImagen);

        // Pasar el buffer a image-size
        const dimensiones = imageSize(buffer);
        const anchoPx = dimensiones.width;
        const altoPx = dimensiones.height;
        const escala = Number(process.env.ESCALA) || 0.05;

        this.ESCALA_METROS_POR_PIXEL = escala;
        this.ANCHO_MAPA_M = anchoPx * escala;
        this.ALTO_MAPA_M = altoPx * escala;
    }

    // Convierte coordenadas (x, y) en metros a porcentajes CSS (left, top)
    metrosACssPorcentaje(x, y) {
        const offSetX = Number(process.env.OFF_SET_X || 0);
        const offSetY = Number(process.env.OFF_SET_Y || 0);

        // Limitar coordenadas dentro de los bordes del mapa
        x = Math.min(Math.max(x, 0), this.ANCHO_MAPA_M);
        y = Math.min(Math.max(y, 0), this.ALTO_MAPA_M);

        // Calcular porcentaje horizontal (left)
        const left_pct = ((x + offSetX) / this.ANCHO_MAPA_M) * 100;
        // Calcular porcentaje vertical (top), invirtiendo el eje Y
        const top_pct = ((this.ALTO_MAPA_M - (y + offSetY)) / this.ALTO_MAPA_M) * 100;

        // Devolver coordenadas en formato CSS
        return { left: `${left_pct.toFixed(2)}%`, top: `${top_pct.toFixed(2)}%` };
    }
    numeroParaBits(valor, numBits) {
        const bits = [];
        for (let i = 0; i < numBits; i++) {
            bits.push((valor >> i) & 1); // extrae el i-ésimo bit
        }
        return bits;
    }

    // Obtiene los bits del campo "Inputs" de una fila de entry_gui
    obtenerBitsEntrada(entryRow, llave = "Inputs", numBits = 14) {
        return this.numeroParaBits(entryRow[llave] || 0, numBits);
    }

    // Obtiene los bits del campo "Outputs" de una fila de entry_gui
    obtenerBitsSalida(entryRow, llave = "Outputs", numBits = 4) {
        return this.numeroParaBits(entryRow[llave] || 0, numBits);
    }
    // Procesa los datos de entry_gui para obtener los AGVs en formato CSS con estado
    obtenerAgvs(entryRow) {
        const agvsIdx = [];
        // Buscar todos los AGVs definidos en la fila
        for (let i = 1; i <= 100; i++) {
            if (`X_AGV${i}` in entryRow) agvsIdx.push(i);
        }

        const x = agvsIdx.map((i) => entryRow[`X_AGV${i}`]);
        const y = agvsIdx.map((i) => entryRow[`Y_AGV${i}`]);
        const a = agvsIdx.map((i) => entryRow[`A_AGV${i}`]);
        const s = agvsIdx.map((i) => entryRow[`COM_AGV${i}`]); // ← estados

        return this.obtenerElementosAgv(x, y, a, s, agvsIdx.length);
    }

    // Construye elementos AGV con conversión a CSS y estado
    obtenerElementosAgv(x, y, angulo, status, numElementos) {
        return Array.from({ length: numElementos }, (_, i) => {
            const coords = this.metrosACssPorcentaje(x[i], y[i]);

            return {
                id: `agv-${i + 1}`,
                left: coords.left,
                top: coords.top,
                imagen: `agv-${i + 1}.svg`,
                angulo: angulo[i],
                status: status[i] // 1 conectado, 0 desconectado
            };
        });
    }


    // Procesa los datos de semáforos y los combina con el estado de bits
    obtenerSemaforos(entryRow, semaforosRows) {
        const total = semaforosRows.length;
        // Convertir el valor de "Semaforo" en bits (uno por semáforo)
        const bits = this.numeroParaBits(entryRow["Semaforo"] || 0, total);
        // Mapear cada semáforo con sus coordenadas y color
        return semaforosRows.map((s, i) => {
            const coords = this.metrosACssPorcentaje(s.X, s.Y);
            coords.id = `semaforo-${i + 1}`;
            coords.color = bits[i]; // 1 = verde, 0 = rojo
            return coords;
        });
    }

    // Función genérica para construir elementos (AGVs o semáforos)
    obtenerElementos(tipo, x, y, angulo, numElementos) {
        return Array.from({ length: numElementos }, (_, i) => {
            const coords = this.metrosACssPorcentaje(x[i], y[i]);
            if (tipo === "agv") {
                coords.id = `agv-${i + 1}`;
                coords.imagen = `agv-${i + 1}.svg`;
                coords.angulo = angulo[i];
            } else if (tipo === "semaforo") {
                coords.id = `semaforo-${i + 1}`;
            }
            return coords;
        });
    }

    // Obtiene el último mensaje almacenado en la tabla entry_gui
    obtenerMensaje(entryRows) {
        if (!entryRows || entryRows.length === 0) return "";
        const last = entryRows[entryRows.length - 1];
        return last.Mensajes || "";
    }
}

module.exports = Conversiones;
