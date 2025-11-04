document.addEventListener("DOMContentLoaded", function () {
    const botonRuta = document.getElementById("botonRuta");
    const mapa = document.getElementById("mapa-img");
    const botonMas = document.getElementById("botonMas");
    const botonMenos = document.getElementById("botonMenos");
    const contador = document.getElementById("contador");
    const agvsContainer = document.getElementById("agvs-container");

    if (!botonRuta || !mapa || !botonMas || !botonMenos || !contador || !agvsContainer) {
        console.error("Elemento no encontrado");
        return;
    }

    let mostrandoRuta = false;
    let valorContador = parseInt(contador.textContent.trim()) || 0;

    // Botón de ruta
    botonRuta.addEventListener("click", function () {
        mostrandoRuta = !mostrandoRuta;
        mapa.src = mostrandoRuta
            ? "/static/images/mapa-ruta.png"
            : "/static/images/mapa.png";
    });

    // Botón +
    botonMas.addEventListener("click", function () {
        if (valorContador < 10) {
            valorContador++;
            contador.textContent = valorContador;

            // Crear un nuevo AGV en la esquina inferior izquierda
            const nuevoAgv = document.createElement("img");
            nuevoAgv.id = `agv-${valorContador}`;
            nuevoAgv.className = "agv";
            nuevoAgv.src = `/static/images/agv-${valorContador}.svg`; // ← nomenclatura correcta
            nuevoAgv.style.position = "absolute";
            nuevoAgv.style.left = "15px";
            nuevoAgv.style.right = "16px"
            nuevoAgv.style.bottom = "25px";
            nuevoAgv.style.width = "30px";
            nuevoAgv.style.height = "30px";
            nuevoAgv.style.transform = "translate(-50%, 50%)";

            agvsContainer.appendChild(nuevoAgv);
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
});


/**
 * Actualiza o crea elementos posicionables (AGVs, semáforos, etc.) en el mapa.
 */
function actualizarElementos(url, colorMapping = {}, includeRotation = false) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            data.forEach(info => {
                // Normaliza valores
                const leftPx = (typeof info.left === "number") ? `${info.left}px` : info.left;
                const topPx  = (typeof info.top === "number") ? `${info.top}px`  : info.top;

                // Si no hay coordenadas válidas, no hacemos nada
                if (!leftPx || !topPx) return;

                let el = document.getElementById(info.id);

                // Crear solo si no existe y hay coordenadas válidas
                if (!el) {
                    el = document.createElement("img");
                    el.id = info.id;
                    el.className = "map-item";
                    el.style.position = "absolute";
                    el.style.width = "30px";
                    el.style.height = "30px";
                    el.style.transform = "translate(-50%, -50%)";
                    el.src = (colorMapping && colorMapping.default) || "/static/images/agv.svg";

                    const container = document.getElementById("agvs-container") || document.body;
                    container.appendChild(el);
                }

                // Actualizar posición
                el.style.left = leftPx;
                el.style.top = topPx;

                // Actualizar imagen según color
                if (colorMapping && typeof info.color !== "undefined") {
                    el.src = colorMapping[info.color] || colorMapping.default || el.src;
                }

                // Rotación si aplica
                if (includeRotation && typeof info.angulo !== "undefined") {
                    const base = "translate(-50%, -50%)";
                    el.style.transform = `${base} rotate(${info.angulo}deg)`;
                }
            });
        })
        .catch(err => console.error("Error al actualizar elementos:", err));
}

function actualizarSemaforos(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            data.forEach(info => {
                const el = document.getElementById(info.id);
                if (!el) return;

                el.src = info.color === 1
                    ? "/static/images/punto-verde.png"
                    : "/static/images/punto-rojo.png";

                el.style.left = info.left;
                el.style.top = info.top;
            });
        })
        .catch(err => console.error("Error al actualizar semáforos:", err));
}


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
                    .catch(err => console.error("Erro ao forçar cinza nas entradas:", err));

                document.querySelectorAll(".salida-bit").forEach(img => {
                    img.src = "/static/images/punto-gris.png";
                });

                const plc = document.getElementById("plc-status");
                if (plc) plc.src = "/static/images/punto-rojo.png";
            }
        })
        .catch(err => console.error("Erro ao verificar COM:", err));
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
        .catch(err => console.error("Erro ao actualizar entradas:", err));
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


// Mapeos de imágenes
const colorMappingSemaforos = {
    0: "/static/images/punto-rojo.png",
    1: "/static/images/punto-verde.png",
    default: "/static/images/punto-gris.png"
};

const colorMappingAgvs = {
    default: "../static/images/agv.svg"
};


// Intervalos de actualización periódica
setInterval(actualizarOrdenes, 5000);
setInterval(() => actualizarElementos("/api/punto_agv", colorMappingAgvs, true), 5000);
setInterval(checkCom, 2000);
setInterval(() => actualizarSemaforos("/api/punto_semaforo"), 5000);
setInterval(actualizarComunicaciones, 3000);
setInterval(actualizarMensaje, 3000);


// Llamadas iniciales al cargar la página
actualizarOrdenes();
actualizarElementos("/api/punto_agv", colorMappingAgvs, true);
actualizarSemaforos("/api/punto_semaforo");
actualizarComunicaciones();
actualizarMensaje();
checkCom();
