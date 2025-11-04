// Helpers
function normalizarAgvId(id) {
  return String(id).trim().toLowerCase();
}

function toCssPx(val) {
  // Si viene número -> lo tratamos como px
  if (typeof val === "number") return `${val}px`;
  // Si viene string con unidad (%) o (px) o similar -> respetamos
  if (typeof val === "string") {
    const s = val.trim();
    if (s.endsWith("%") || s.endsWith("px")) return s;
    if (!isNaN(Number(s))) return `${s}px`; // "30" -> "30px"
  }
  return val;
}

function aplicarUnidadPosicion(val) {
  // Compatibilidad: si el backend antes devolvía left/top o x/y como porcentaje
  // y ahora da números en px, preferimos px (toCssPx).
  return toCssPx(val);
}

document.addEventListener("DOMContentLoaded", function () {
  const botonRuta = document.getElementById("botonRuta");
  const mapaImg = document.getElementById("mapa-img");
  const botonMas = document.getElementById("botonMas");
  const botonMenos = document.getElementById("botonMenos");
  const contador = document.getElementById("contador");
  const agvsContainer = document.getElementById("agvs-container");

  if (!botonRuta || !mapaImg || !botonMas || !botonMenos || !contador || !agvsContainer) {
    console.error("Elemento no encontrado");
    return;
  }

  let mostrandoRuta = false;
  let valorContador = parseInt(contador.textContent.trim()) || 0;

  // Botón de ruta
  botonRuta.addEventListener("click", function () {
    mostrandoRuta = !mostrandoRuta;
    mapaImg.src = mostrandoRuta ? "/static/images/mapa-ruta.png" : "/static/images/mapa.png";
  });

  // Coordenadas deseadas para nuevo AGV (X desde izquierda en px, Y desde abajo en px)
  const NUEVO_AGV_X_PX = 30; // 30 px desde la izquierda
  const NUEVO_AGV_Y_FROM_BOTTOM_PX = 50; // 50 px desde la parte inferior

  // Crear/colocar AGV en coordenadas dadas (xPxFromLeft, yPxFromBottom en números)
  function crearAgvEnCoordenadas(index, xPxFromLeft, yPxFromBottom) {
    const idDom = `agv-${index}`;
    let el = document.getElementById(idDom);

    if (!el) {
      el = document.createElement("img");
      el.id = idDom;
      el.className = "agv";
      el.src = `/static/images/${idDom}.svg`;
      el.style.position = "absolute";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.transform = "translate(-50%, 50%)"; // base para centrar/pegar por abajo
      agvsContainer.appendChild(el);
    }

    // Calculamos top en px a partir de la altura del contenedor y la distancia desde bottom
    const containerH = agvsContainer.clientHeight || agvsContainer.offsetHeight || 0;
    const topPx = containerH ? (containerH - yPxFromBottom) : null;

    el.style.left = `${xPxFromLeft}px`;
    if (topPx !== null && !Number.isNaN(topPx)) {
      el.style.top = `${topPx}px`;
      // eliminar bottom si estaba presente como fallback
      el.style.bottom = "";
    } else {
      // fallback: si no conocemos altura aún, colocamos usando bottom
      el.style.bottom = `${yPxFromBottom}px`;
      el.style.top = "";
    }
  }

  // Botón +
  botonMas.addEventListener("click", function () {
    if (valorContador < 10) {
      valorContador++;
      contador.textContent = valorContador;

      // Crear AGV en X=30px desde izquierda y Y=50px desde bottom
      crearAgvEnCoordenadas(valorContador, NUEVO_AGV_X_PX, NUEVO_AGV_Y_FROM_BOTTOM_PX);
    }
  });

  // Botón −
  botonMenos.addEventListener("click", function () {
    if (valorContador > 0) {
      const ultimoAgv = document.getElementById(`agv-${valorContador}`);
      if (ultimoAgv) {
        agvsContainer.removeChild(ultimoAgv);
      }
      valorContador--;
      contador.textContent = valorContador;
    }
  });

  // Llamadas iniciales
  actualizarOrdenes();
  actualizarAgvs("/api/punto_agv");
  actualizarSemaforos("/api/punto_semaforo");
  actualizarComunicaciones();
  actualizarMensaje();
  checkCom();

  // Intervalos
  setInterval(actualizarOrdenes, 5000);
  setInterval(() => actualizarAgvs("/api/punto_agv"), 5000);
  setInterval(() => actualizarSemaforos("/api/punto_semaforo"), 5000);
  setInterval(actualizarComunicaciones, 3000);
  setInterval(actualizarMensaje, 3000);
  setInterval(checkCom, 2000);
});

/**
 * Actualiza/crea AGVs desde el endpoint /api/punto_agv
 * Acepta: { id: "AGV-1"|"agv-1", x: number|"50%"|"30px", y: number|"50%"|"30px", angle: grados }
 */
function actualizarAgvs(url) {
  const container = document.getElementById("agvs-container");
  if (!container) return;
  const maxVisible = parseInt(document.getElementById("contador").textContent) || 0;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      data.forEach(info => {
        const idDom = normalizarAgvId(info.id);
        let el = document.getElementById(idDom);

        // Si el contador es 0 no creamos elementos nuevos; sólo actualizamos si ya existen
        if (!el) {
          if (maxVisible <= 0) return; // saltar creación
          // si el contador permite, crear hasta maxVisible
          const index = Number(idDom.split('-')[1]) || 0;
          if (index > maxVisible) return;
          el = document.createElement("img");
          el.id = idDom;
          el.className = "agv";
          el.src = `/static/images/${idDom}.svg`;
          el.style.position = "absolute";
          el.style.width = "30px";
          el.style.height = "30px";
          el.style.transform = "translate(-50%, 50%)";
          container.appendChild(el);
        }

        // actualizar posición/rotación
        el.style.left = aplicarUnidadPosicion(info.x ?? info.left);
        el.style.top  = aplicarUnidadPosicion(info.y ?? info.top);
        const angleDeg = Number(info.angle ?? info.A ?? 0) || 0;
        el.style.transform = `translate(-50%, 50%) rotate(${angleDeg}deg)`;
      });
    })
    .catch(err => console.error("Error al actualizar AGVs:", err));
}


/**
 * Actualiza/crea semáforos desde el endpoint /api/punto_semaforo
 * Acepta: { id:"semaforo-1", left:number|string, top:number|string, color:0|1|null }
 */
function actualizarSemaforos(url) {
  const container = document.getElementById("agvs-container");
  if (!container) return;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      data.forEach(info => {
        let el = document.getElementById(info.id);

        if (!el) {
          el = document.createElement("img");
          el.id = info.id;
          el.className = "semaforo";
          el.style.position = "absolute";
          el.style.width = "20px";
          el.style.height = "20px";
          el.style.transform = "translate(-50%, -50%)";
          el.src = "/static/images/punto-gris.png"; // default
          container.appendChild(el);
        }

        // Posición: número -> px, string con %/px -> respetar
        el.style.left = aplicarUnidadPosicion(info.left);
        el.style.top  = aplicarUnidadPosicion(info.top);

        // Imagen por estado (1=verde, 0=rojo, otro=gris)
        if (info.color === 1) {
          el.src = "/static/images/punto-verde.png";
        } else if (info.color === 0) {
          el.src = "/static/images/punto-rojo.png";
        } else {
          el.src = "/static/images/punto-gris.png";
        }
      });
    })
    .catch(err => console.error("Error al actualizar semáforos:", err));
}

// --- resto de funciones de UI (comunicaciones, órdenes, bits) ---
function actualizarComunicaciones() {
  fetch("/api/estado_comunicaciones", { cache: "no-store" })
    .then(res => res.json())
    .then(data => {
      const plc = document.getElementById("plc-status");
      if (plc) {
            plc.src = data.plc === 1
            ? "/static/images/punto-verde.png"
            : "/static/images/punto-rojo.png";
        }

      const container = document.getElementById("estado-agvs");
        if (container) {
            container.innerHTML = "";
            data.agvs.forEach((agv) => {
            const etiqueta = document.createElement("span");
            etiqueta.className = "etiqueta";
            etiqueta.textContent = `${agv.id}:`;

            const imagen = document.createElement("img");
            imagen.className = "entrada-bit";
            imagen.src = agv.status === 1
                ? "/static/images/punto-verde.png"
                : "/static/images/punto-rojo.png";

            container.appendChild(etiqueta);
            container.appendChild(imagen);
        });
      }
    })
    .catch(err => console.error("Error al actualizar comunicaciones:", err));
}

function actualizarOrdenes() {
    fetch("/api/ordenes")
        .then(res => res.json())
        .then(ordenes => {
        const tbody = document.getElementById("ordenes-container");
        if (!tbody) return;

        tbody.innerHTML = "";
        if (ordenes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3">No hay órdenes registradas.</td></tr>`;
            return;
        }

        ordenes.forEach(o => {
            tbody.innerHTML += `
            <tr>
                <th scope="row">${o.id}</th>
                <td>${o.origen}</td>
                <td>${o.destino}</td>
            </tr>
            `;
        });
        })
    .catch(err => console.error("Error al buscar órdenes:", err));
}

function checkCom() {
    fetch("/api/com")
        .then(res => res.json())
        .then(data => {
        const com = data.COM;

        if (com === 1) {
            actualizarEntradas();
            actualizarSalidas();
        } else {
            fetch("/api/inputs")
                .then(res => res.json())
                .then(bits => {
                    bits.forEach((bit, index) => {
                        const img = document.querySelector(`.entrada-bit[data-entrada="${index}"]`);
                        if (img) {
                            img.src = "/static/images/punto-gris.png";
                        }
                    });
                })
            .catch(err => console.error("Error al forzar las entradas:", err));

                document.querySelectorAll(".salida-bit").forEach(img => {
                img.src = "/static/images/punto-gris.png";
            });

            const plc = document.getElementById("plc-status");
            if (plc) plc.src = "/static/images/punto-rojo.png";
        }
    })
    .catch(err => console.error("Error al verificar COM:", err));
}

function actualizarEntradas() {
    fetch("/api/inputs")
        .then(res => res.json())
        .then(bits => {
        bits.forEach((bit, index) => {
            const img = document.querySelector(`.entrada-bit[data-entrada="${index}"]`);
            if (img) {
                img.src = bit === 1
                    ? "/static/images/punto-verde.png"
                    : "/static/images/punto-rojo.png";
            }
        });
    })
    .catch(err => console.error("Error al actualizar entradas:", err));
}

function actualizarSalidas() {
    fetch("/api/outputs")
        .then(res => res.json())
        .then(bits => {
        bits.forEach((bit, index) => {
            const img = document.querySelector(`.salida-bit[data-salida="${index}"]`);
            if (img) {
            img.src = bit === 1
                ? "/static/images/punto-verde.png"
                : "/static/images/punto-rojo.png";
            }
        });
        })
    .catch(err => console.error("Error al actualizar salidas:", err));
}

function actualizarMensaje() {
    fetch("/api/mensaje", { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
        const mensajeElemento = document.getElementById("mensaje-dinamico");
        if (mensajeElemento && data.mensaje !== undefined) {
            mensajeElemento.textContent = data.mensaje;
        }
    })
    .catch(err => console.error("Error al actualizar mensaje:", err));
}
