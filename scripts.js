// Almacenar el valor de regexInput cuando se hace clic en el botón Send
let regexInput = "";
let afdNopGraph, afdOptGraph; // Variables globales para los grafos

document.getElementById("submitBtn").addEventListener("click", function () {
  // Guardamos el valor de la expresión regular ingresada
  regexInput = document.getElementById("regexInput").value;
  resetForm();

  // Llamamos a la API 1 para obtener el grafo según la expresión regular ingresada
  fetch(`http://localhost:3600/api1/${regexInput}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      return response.json();
    })
    .then((data) => {
      // Graficar y mostrar datos solo después de que los datos se hayan cargado
      graficarThompson(data); // Graficar Thompson
      graficarAFDNop(data); // Graficar AFD no óptimo
      graficarAFDOpt(data); // Graficar AFD óptimo
      TableThompson(data); // Mostrar tabla de Thompson
      TableAFDNop(data); // Mostrar tabla del AFD no óptimo
      TableAFDOpt(data); // Mostrar tabla del AFD óptimo

      mostrarIdenticos(data); // Mostrar los estados idénticos
      mostrarSimbolos(regexInput); // Mostrar símbolos

      // Volver a mostrar los gráficos y tablas una vez que se han cargado
      document
        .querySelectorAll(".container-graph-table")
        .forEach(function (element) {
          element.classList.remove("hidden");
        });

      document
        .querySelectorAll(".container-cadena")
        .forEach(function (element) {
          element.classList.remove("hidden");
        });
    })
    .catch((error) => {
      Swal.fire({
        icon: "error",
        title: "Error al cargar datos",
        html: `
                <p><strong style="color: #d33;">Verifica lo siguiente:</strong></p>
                <ul style="text-align: left; list-style-type: disc; margin-left: 20px;">
                    <li>Expresión regular válida.</li>
                    <li>Servidor en funcionamiento.</li>
                    <li>Revisa la consola para más detalles.</li>
                </ul>
            `,
        confirmButtonText: "Entendido",
        confirmButtonColor: "gray",
        customClass: {
          popup: "smaller-swal-popup", // Clase personalizada para el popup
          confirmButton: "custom-swal-button", // Clase personalizada para el botón
        },
      });
    });
});

// Llamada a las APIs para el AFD No Óptimo y AFD Óptimo
document.getElementById("submitButton").addEventListener("click", function () {
  const inputCadena = document.getElementById("cadena").value;

  // Crear una expresión regular a partir del valor de regexInput
  const regex = new RegExp(regexInput); // `regexInput` es la expresión regular introducida en la API 1

  // Verificar si la cadena vacía es aceptada por la expresión regular
  if (inputCadena === "" && regex.test("")) {
    mostrarResultadoCadenaVacia(); // Si es vacía y válida según la regex
    return;
  } else if (inputCadena === "" && !regex.test("")) {
    mostrarResultadoCadenaInvalida(); // Si es vacía pero no válida
    return;
  }

  // Ejecutar primero la solicitud para el AFD No Óptimo y luego la del AFD Óptimo
  fetch(`http://localhost:3600/api2/${regexInput}/nop/${inputCadena}`)
    .then((response) => response.json())
    .then((dataNop) => {
      // Procesar los datos del AFD No Óptimo
      currentTransitionsNop = dataNop.transitions;
      construirMapeo(afdNopGraph, nodeIdMapNop);
      mostrarRecorrido(dataNop, "AFD No Óptimo");

      return fetch(
        `http://localhost:3600/api2/${regexInput}/op/${inputCadena}`
      );
    })
    .then((response) => response.json())
    .then((dataOpt) => {
      // Procesar los datos del AFD Óptimo
      currentTransitionsOpt = dataOpt.transitions;
      construirMapeo(afdOptGraph, nodeIdMapOpt);
      mostrarRecorrido(dataOpt, "AFD Óptimo");
    })
    .catch((error) => {
      console.error("Error al procesar las solicitudes:", error);
    });
});

// Crear un objeto de mapeo dinámico para cada grafo
let nodeIdMapNop = {};
let nodeIdMapOpt = {};

// Estado del recorrido para AFD No Óptimo
let currentIndexNop = 0;
let currentTransitionsNop = [];
let traversalIntervalNop = null;

// Estado del recorrido para AFD Óptimo
let currentIndexOpt = 0;
let currentTransitionsOpt = [];
let traversalIntervalOpt = null;

// Función para construir el mapeo de etiquetas a IDs de nodos
function construirMapeo(graph, map) {
  Object.keys(map).forEach((key) => delete map[key]);
  const nodos = graph.body.data.nodes.get();
  nodos.forEach((nodo) => {
    map[nodo.label.trim()] = nodo.id;
  });
}

// Función para resaltar un nodo en el grafo y mantener el color original después de cierto tiempo
function highlightNode(graph, map, nodeId, duration) {
  const mappedId = map[nodeId.trim()];
  if (!mappedId) {
    return;
  }

  const node = graph.body.data.nodes.get(mappedId);
  if (node) {
    const originalColor = { background: "#89CFF0", border: "#5DADE2" };
    graph.body.data.nodes.update({
      id: mappedId,
      color: { background: "gray", border: "gray" },
    });
    setTimeout(() => {
      graph.body.data.nodes.update({ id: mappedId, color: originalColor });
    }, duration);
  }
}

// Función para resaltar una arista en el grafo y mantener el color original después de cierto tiempo
function highlightEdge(graph, map, fromId, toId, duration) {
  const mappedFromId = map[fromId.trim()];
  const mappedToId = map[toId.trim()];
  const edges = graph.body.data.edges.get();
  const edge = edges.find(
    (e) => e.from === mappedFromId && e.to === mappedToId
  );

  if (edge) {
    const originalColor = edge.color || { color: "#5DADE2" };
    graph.body.data.edges.update({ id: edge.id, color: { color: "gray" } });
    setTimeout(() => {
      graph.body.data.edges.update({ id: edge.id, color: originalColor });
    }, duration);
  }
}

// Función para manejar el recorrido automático del AFD No Óptimo
function automaticTraversalNop() {
  if (currentIndexNop < currentTransitionsNop.length) {
    const transition = currentTransitionsNop[currentIndexNop];

    highlightNode(afdNopGraph, nodeIdMapNop, transition.node1, 1000);
    setTimeout(() => {
      highlightEdge(
        afdNopGraph,
        nodeIdMapNop,
        transition.node1,
        transition.node2,
        1000
      );
    }, 1000);
    setTimeout(() => {
      highlightNode(afdNopGraph, nodeIdMapNop, transition.node2, 1000);
      currentIndexNop++;
    }, 2000);
  } else {
    clearInterval(traversalIntervalNop);
  }
}

// Función para manejar el recorrido automático del AFD Óptimo
function automaticTraversalOpt() {
  if (currentIndexOpt < currentTransitionsOpt.length) {
    const transition = currentTransitionsOpt[currentIndexOpt];

    highlightNode(afdOptGraph, nodeIdMapOpt, transition.node1, 1000);
    setTimeout(() => {
      highlightEdge(
        afdOptGraph,
        nodeIdMapOpt,
        transition.node1,
        transition.node2,
        1000
      );
    }, 1000);
    setTimeout(() => {
      highlightNode(afdOptGraph, nodeIdMapOpt, transition.node2, 1000);
      currentIndexOpt++;
    }, 2000);
  } else {
    clearInterval(traversalIntervalOpt);
  }
}

// Función para iniciar el recorrido automático en AFD No Óptimo
function startTraversalNop() {
  clearInterval(traversalIntervalNop);
  currentIndexNop = 0;
  traversalIntervalNop = setInterval(automaticTraversalNop, 3000); // Cada 3 segundos avanzamos
}

// Función para iniciar el recorrido automático en AFD Óptimo
function startTraversalOpt() {
  clearInterval(traversalIntervalOpt);
  currentIndexOpt = 0;
  traversalIntervalOpt = setInterval(automaticTraversalOpt, 3000);
}

// Asociar el botón "Start Traversal" al AFD No Óptimo
document
  .getElementById("startButtonNop")
  .addEventListener("click", function () {
    const inputCadena = document.getElementById("cadena").value;
    const regex = new RegExp(regexInput);

    // Verificar si la cadena vacía es aceptada por la expresión regular
    if (inputCadena === "" && regex.test("")) {
      resaltarPrimerNodo(afdNopGraph, nodeIdMapNop);
      return;
    } else {
      startTraversalNop(); // Iniciar el recorrido normal
    }
  });

// Asociar el botón "Start Traversal" al AFD Óptimo
document
  .getElementById("startButtonOpt")
  .addEventListener("click", function () {
    const inputCadena = document.getElementById("cadena").value; // Obtener el valor de la cadena
    const regex = new RegExp(regexInput); // Crear la expresión regular a partir de la entrada

    // Verificar si la cadena vacía es aceptada por la expresión regular
    if (inputCadena === "" && regex.test("")) {
      resaltarPrimerNodo(afdOptGraph, nodeIdMapOpt); // Resaltar el primer nodo en AFD Óptimo

      return;
    } else {
      startTraversalOpt();
    }
  });

// Función para mostrar el resultado si la cadena vacía es aceptada
function mostrarResultadoCadenaVacia() {
  let inputField = document.getElementById("cadena");
  recorridoDivOpt = document.getElementById("recorridoOpt");
  recorridoDivNop = document.getElementById("recorridoNop");

  // Mostrar directamente que la expresión vacía es aceptada
  document.getElementById(
    "resultadoNop"
  ).innerHTML = `<p class="result-text"><span class="accepted">Regular expression accepted (empty string)</span></p>`;
  document.getElementById(
    "resultadoOpt"
  ).innerHTML = `<p class="result-text"><span class="accepted">Regular expression accepted (empty string)</span></p>`;

  // Cambiar el color del input a verde (valid-input)
  inputField.classList.remove("invalid-input");
  inputField.classList.add("valid-input");

  // Asegurarse de que los contenedores estén visibles si estaban ocultos
  document.getElementById("resultadoNop").classList.remove("hidden");
  document.getElementById("resultadoOpt").classList.remove("hidden");
  recorridoDivOpt.classList.add("hidden");
  recorridoDivNop.classList.add("hidden");
}

// Función para resaltar un nodo directamente por su ID en el grafo sin afectar las aristas
function highlightNodeById(graph, nodeId, duration) {
  const node = graph.body.data.nodes.get(nodeId); // Obtener el nodo directamente por su ID

  if (node) {
    const originalNodeColor = { background: "#89CFF0", border: "#5DADE2" }; // Colores originales del nodo

    // Actualizar el color del nodo a gris (sin afectar las aristas)
    graph.body.data.nodes.update({
      id: nodeId,
      color: { background: "gray", border: "gray" }, // Cambia solo el color del nodo
    });

    // Restaurar el color original del nodo después de `duration` milisegundos
    setTimeout(() => {
      graph.body.data.nodes.update({ id: nodeId, color: originalNodeColor }); // Restaurar color del nodo
    }, duration);
  }
}

// Función para resaltar el primer nodo (sin cambiar el color de la arista)
function resaltarPrimerNodo(graph) {
  // Buscar la arista que tiene la etiqueta 'start' y el nodo de destino
  const edges = graph.body.data.edges.get();
  const startEdge = edges.find((edge) => edge.label === "start"); // Buscar arista con etiqueta 'start'

  if (startEdge) {
    const startNodeId = startEdge.to; // Obtener el ID del nodo destino
    if (startNodeId) {
      highlightNodeById(graph, startNodeId, 2000); // Resaltar solo el nodo por 2 segundos
    }
  }
}

// Función para mostrar el resultado si la cadena vacía no es aceptada
function mostrarResultadoCadenaInvalida() {
  let inputField = document.getElementById("cadena");
  let startButtonNop = document.getElementById("startButtonNop");
  let startButtonOpt = document.getElementById("startButtonOpt");
  recorridoDivOpt = document.getElementById("recorridoOpt");
  recorridoDivNop = document.getElementById("recorridoNop");

  // Mostrar directamente que la expresión vacía es rechazada
  document.getElementById(
    "resultadoNop"
  ).innerHTML = `<p class="result-text"><span class="rejected">Regular expression rejected (empty string)</span></p>`;
  document.getElementById(
    "resultadoOpt"
  ).innerHTML = `<p class="result-text"><span class="rejected">Regular expression rejected (empty string)</span></p>`;

  // Cambiar el color del input a rojo (invalid-input)
  inputField.classList.remove("valid-input");
  inputField.classList.add("invalid-input");

  // Asegurarse de que los contenedores estén visibles si estaban ocultos
  document.getElementById("resultadoNop").classList.remove("hidden");
  document.getElementById("resultadoOpt").classList.remove("hidden");

  // Deshabilitar los botones de Start si la cadena es rechazada
  startButtonNop.disabled = true;
  startButtonOpt.disabled = true;
  startButtonNop.classList.add("disabled-button");
  startButtonOpt.classList.add("disabled-button");
  recorridoDivOpt.classList.add("hidden");
  recorridoDivNop.classList.add("hidden");
}

// Función para mostrar el recorrido en el DOM y cambiar el color del input
function mostrarRecorrido(data, afdType) {
  let recorridoDiv = "";
  let resultadoDiv = "";
  let inputField = document.getElementById("cadena"); // Input donde ingresas la cadena

  let startButtonNop = document.getElementById("startButtonNop");
  let startButtonOpt = document.getElementById("startButtonOpt");
  let repeatButtonNop = document.getElementById("repeatButtonNop");
  let repeatButtonOpt = document.getElementById("repeatButtonOpt");

  // Asignar los elementos de acuerdo al tipo de AFD
  if (afdType === "AFD No Óptimo") {
    recorridoDiv = document.getElementById("recorridoNop");
    resultadoDiv = document.getElementById("resultadoNop");
  } else if (afdType === "AFD Óptimo") {
    recorridoDiv = document.getElementById("recorridoOpt");
    resultadoDiv = document.getElementById("resultadoOpt");
  }

  // Verificar si los divs existen antes de continuar
  if (!recorridoDiv || !resultadoDiv) {
    return; // Detenemos la ejecución si no existen los elementos
  }

  // Asegurarse de que los contenedores estén visibles si estaban ocultos
  recorridoDiv.classList.remove("hidden");
  resultadoDiv.classList.remove("hidden");

  const transitions = data.transitions;
  let recorridoText = "";

  // Crear la representación del recorrido
  transitions.forEach((transition) => {
    recorridoText += `<div class="transition-container">
                          <span class="node">${transition.node1}</span> 
                          <div class="arrow">
                            <i class="fas fa-arrow-right"></i>
                            <span class="edge-label">${transition.chart}</span> <!-- Label de la arista -->
                          </div>
                          <span class="node">${transition.node2}</span>
                        </div>`;
  });

  // Mostrar el recorrido con animación
  recorridoDiv.innerHTML = `<div class="recorrido-container">${recorridoText}</div>`;

  // Mostrar el resultado de aceptación o rechazo
  resultadoDiv.innerHTML = `<p class="result-text">
          <span class="${data.sussefull ? "accepted" : "rejected"}">
          ${
            data.sussefull
              ? "Regular expression accepted"
              : "Regular expression rejected"
          }
          </span></p>`;

  // Cambiar el color del input según si la expresión regular fue aceptada o rechazada
  if (data.sussefull) {
    inputField.classList.remove("invalid-input");
    inputField.classList.add("valid-input");

    // Habilitar los botones de Start si la cadena es aceptada
    startButtonNop.disabled = false;
    startButtonOpt.disabled = false;
    startButtonNop.classList.remove("disabled-button");
    startButtonOpt.classList.remove("disabled-button");
  } else {
    inputField.classList.remove("valid-input");
    inputField.classList.add("invalid-input");

    // Deshabilitar los botones de Start si la cadena es rechazada
    startButtonNop.disabled = true;
    startButtonOpt.disabled = true;
    startButtonNop.classList.add("disabled-button");
    startButtonOpt.classList.add("disabled-button");
    repeatButtonNop.style.display = "none";
    repeatButtonOpt.style.display = "none";
  }
}

// Detectar cuando se borra la cadena y resetear el estilo
document.getElementById("cadena").addEventListener("input", function () {
  const inputField = document.getElementById("cadena");

  // Si el campo está vacío, eliminar los estilos de validación
  if (inputField.value === "") {
    inputField.classList.remove("valid-input");
    inputField.classList.remove("invalid-input");
  }
});

// Función para resetear el campo de texto y los resultados
function resetForm() {
  let inputField = document.getElementById("cadena"); // El campo de texto
  let recorridoNop = document.getElementById("recorridoNop"); // Div del recorrido AFD No Óptimo
  let recorridoOpt = document.getElementById("recorridoOpt"); // Div del recorrido AFD Óptimo
  let resultadoNop = document.getElementById("resultadoNop"); // Div del resultado AFD No Óptimo
  let resultadoOpt = document.getElementById("resultadoOpt"); // Div del resultado AFD Óptimo
  let startButtonNop = document.getElementById("startButtonNop");
  let startButtonOpt = document.getElementById("startButtonOpt");

  // Limpiar el campo de texto
  inputField.value = "";

  // Eliminar las clases de valid-input y invalid-input
  inputField.classList.remove("valid-input");
  inputField.classList.remove("invalid-input");

  // Limpiar los divs de los recorridos y resultados
  recorridoNop.innerHTML = "";
  resultadoNop.innerHTML = "";
  recorridoOpt.innerHTML = "";
  resultadoOpt.innerHTML = "";

  // Resetear los índices de los recorridos
  currentIndexNop = 0;
  currentIndexOpt = 0;

  // Detener cualquier intervalo en ejecución (por seguridad)
  clearInterval(traversalIntervalNop);
  clearInterval(traversalIntervalOpt);

  // Habilitar los botones de Start
  startButtonNop.disabled = false;
  startButtonOpt.disabled = false;
  startButtonNop.classList.remove("disabled-button");
  startButtonOpt.classList.remove("disabled-button");
}

// Añadir evento para el botón de reset
document.getElementById("resetButton").addEventListener("click", function () {
  resetForm();
});

function mostrarSimbolos(regex) {
  // Crear un Set para almacenar los símbolos únicos
  let simbolosSet = new Set();

  // Recorrer la expresión regular y agregar solo los símbolos válidos (ej. letras a-z)
  for (let char of regex) {
    if (/[a-zA-Z]/.test(char)) {
      // Filtrar solo letras (puedes ajustar esto si tu alfabeto incluye otros símbolos)
      simbolosSet.add(char);
    }
  }

  // Convertir el Set a un array y luego a un string en formato {a, b, ...}
  let simbolosArray = Array.from(simbolosSet).sort(); // Ordenar alfabéticamente
  let simbolosString = `Σ = {${simbolosArray.join(", ")}}`;

  // Seleccionar todos los elementos con la clase 'simbolos' e insertar el HTML en cada uno
  document.querySelectorAll(".simbolos").forEach(function (simbolosDiv) {
    simbolosDiv.innerHTML = `
            <h3>Symbols</h3>
            <p>${simbolosString}</p>
        `;
  });
}

function graficarThompson(data) {
  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();

  // Identificadores para los nodos iniciales y finales
  let initialNode = null;
  let finalNode = null;

  // Añadir nodos
  data.graph.nodes.forEach((node) => {
    let nodeOptions = {
      id: node.tag,
      label: `${node.tag}` + (node.initial ? "" : "") + (node.final ? " " : ""),
      shape: node.final ? "box" : "circle",
      borderWidth: node.final ? 4 : 1, // Borde más ancho para el nodo final
    };

    if (node.initial) {
      initialNode = node.tag;
    }
    if (node.final) {
      finalNode = node.tag;
    }

    nodes.add(nodeOptions);
  });

  // Añadir aristas
  data.graph.nodes.forEach((node) => {
    node.adj.forEach((adj) => {
      const destino = adj[0]; // Nodo de destino
      const transicion = adj[1]; // Símbolo de transición, puede ser "a", "b", "&", etc.

      // Añadir la arista con la etiqueta correcta
      edges.add({
        from: node.tag,
        to: destino,
        label: transicion, // Asigna la transición correcta de los datos
      });
    });
  });

  // Si existe un nodo inicial, agregar un nodo invisible apuntando a él
  if (initialNode !== null) {
    nodes.add({
      id: "invisible",
      label: "", // Sin etiqueta
      shape: "circle",
      size: 1, // Tamaño pequeño (prácticamente invisible)
      color: {
        background: "rgba(0, 0, 0, 0)", // Fondo transparente
        border: "rgba(0, 0, 0, 0)", // Borde transparente
      },
    });

    edges.add({
      from: "invisible",
      to: initialNode,
      label: "start",
      arrows: "to", // Flecha apuntando al nodo inicial
      color: {
        color: "#5DADE2", // Color de la flecha
        opacity: 1,
      },
    });
  }

  // Crear el grafo en el contenedor 'network-thompson'
  const container = document.getElementById("network-thompson");
  const networkData = {
    nodes: nodes,
    edges: edges,
  };

  const options = {
    nodes: {
      shape: "circle",
      size: 20,
      color: { background: "#89CFF0", border: "#5DADE2" },
      font: {
        size: 30,
      },
    },
    edges: {
      arrows: {
        to: { enabled: true },
      },
      length: 200,
    },
    physics: {
      enabled: true,
    },
  };

  new vis.Network(container, networkData, options);
}

function TableThompson(data) {
  const transitionTable = data.Transition_table;
  const tablesDiv = document.getElementById("thompson-table");
  tablesDiv.innerHTML = ""; // Limpiar tablas anteriores

  if (!transitionTable) {
    console.error("No hay datos para la tabla de Thompson");
    return;
  }

  // Generar HTML de la tabla
  let transitionTableHTML = `
        <h3>Transition Table</h3>
        <table>
            <thead>
                <tr>
                    <th>State</th>
                    ${Object.keys(transitionTable)
                      .map((input) => `<th>${input}</th>`)
                      .join("")}
                </tr>
            </thead>
            <tbody>
                ${Object.keys(transitionTable["&"])
                  .map(
                    (state) => `
                    <tr>
                        <td>${state}</td>
                        ${Object.keys(transitionTable)
                          .map(
                            (input) => `
                            <td>${
                              transitionTable[input][state].length > 0
                                ? transitionTable[input][state].join(", ")
                                : "-"
                            }</td>
                        `
                          )
                          .join("")}
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;

  tablesDiv.innerHTML = transitionTableHTML;
}
function TableAFDNop(data) {
  const afdNop = data.AFDnop; // Datos del AFD no óptimo
  const T = data.T; // Transiciones de estados
  const alphabet =
    data.alphabet ||
    Object.keys(afdNop).filter((k) => k !== "states" && k !== "values"); // Extraer alfabeto desde los datos o usar uno proporcionado
  const tablesDiv = document.getElementById("afdnop-table"); // ID del contenedor de la tabla
  tablesDiv.innerHTML = "";

  if (!afdNop || !T) {
    console.error("No hay datos para la tabla del AFD no óptimo");
    return;
  }

  // Crear la tabla de transiciones del AFD no óptimo
  let afdTableHTML = `
        <h3>Transitions</h3>
        <table>
            <thead>
                <tr>
                    <th>State</th>
                    ${alphabet
                      .map((symbol) => `<th>${symbol}</th>`)
                      .join(
                        ""
                      )}  <!-- Mostrar las columnas para cada símbolo -->
                </tr>
            </thead>
            <tbody>
                ${Object.keys(afdNop.states)
                  .map(
                    (key) => `
                    <tr>
                        <td>${afdNop.values[key]}${
                      afdNop.states[key]
                    }</td> <!-- Estado y Valor concatenados -->
                        ${alphabet
                          .map(
                            (symbol) => `<td>${afdNop[symbol][key] || "-"}</td>`
                          )
                          .join("")}  <!-- Transiciones para cada símbolo -->
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;

  // Crear la segunda tabla (Estados equivalentes de NFA)
  let tTableHTML = `
        <h3>States</h3>
        <table>
            <thead>
                <tr>
                    <th>State</th>
                    <th>NFA equivalent states</th>
                </tr>
            </thead>
            <tbody>
                ${T.map(
                  (entry) => `
                    <tr>
                        <td>${entry[0]}</td> <!-- Estado -->
                        <td>{${entry[1].join(
                          ", "
                        )}}</td> <!-- Estados equivalentes en el NFA -->
                    </tr>
                `
                ).join("")}
            </tbody>
        </table>
    `;

  // Mostrar ambas tablas
  tablesDiv.innerHTML = afdTableHTML + tTableHTML;
}

function TableAFDOpt(data) {
  const afdOpt = data.AFDop; // Datos del AFD óptimo
  const alphabet = Object.keys(afdOpt).filter(
    (key) => key !== "states" && key !== "values"
  ); // Detectar dinámicamente el alfabeto
  const tablesDiv = document.getElementById("afdopt-table"); // ID del contenedor de la tabla
  const significativos = data.states || []; // Los estados significativos están en data.states

  tablesDiv.innerHTML = ""; // Limpiar tablas anteriores

  // Verificar que los datos necesarios existen
  if (!afdOpt) {
    console.error("No hay datos para la tabla del AFD óptimo");
    return;
  }

  // Crear la tabla de transiciones del AFD óptimo
  let afdTableHTML = `
        <h3>Transitions</h3>
        <table border="1" cellpadding="5" cellspacing="0">
            <thead>
                <tr>
                    <th>State</th>
                    ${alphabet
                      .map((symbol) => `<th>${symbol}</th>`)
                      .join("")} <!-- Mostrar las columnas para cada símbolo -->
                </tr>
            </thead>
            <tbody>
                ${Object.keys(afdOpt.states)
                  .map(
                    (key) => `
                    <tr>
                        <td>${afdOpt.values[key]}${
                      afdOpt.states[key]
                    }</td> <!-- Estado y Valor concatenados -->
                        ${alphabet
                          .map(
                            (symbol) => `<td>${afdOpt[symbol][key] || "-"}</td>`
                          )
                          .join("")} <!-- Transiciones para cada símbolo -->
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;

  // Crear la tabla de estados significativos
  let sigStatesHTML = `
        <h3>States</h3>
        <table border="1" cellpadding="5" cellspacing="0">
            <thead>
                <tr>
                    <th>State</th>
                    <th>NFA significant states</th>
                </tr>
            </thead>
            <tbody>
                ${significativos
                  .map(
                    (entry) => `
                    <tr>
                        <td>Significants(${entry[0]})</td>
                        <td>{${entry[1].join(
                          ", "
                        )}}</td> <!-- Mostrar los estados significativos -->
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;

  // Mostrar ambas tablas
  tablesDiv.innerHTML = afdTableHTML + sigStatesHTML;
}

function graficarAFDOpt(data) {
  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();

  // Identificadores para los nodos iniciales y finales
  let initialNode = null;
  let finalNode = null;

  // Datos del AFD óptimo
  const afdOpt = data.AFDop;

  // Agregar nodos (estados)
  Object.keys(afdOpt.states).forEach((key) => {
    let nodeOptions = {
      id: key,
      label:
        ` ${afdOpt.states[key]}` +
        (afdOpt.values[key].includes("->") ? "" : "") +
        (afdOpt.values[key].includes("*") ? "" : ""),
      shape: afdOpt.values[key].includes("*") ? "box" : "circle",
      borderWidth: afdOpt.values[key].includes("*") ? 4 : 1, // Borde más ancho para el nodo final
    };

    if (afdOpt.values[key].includes("->")) {
      initialNode = key;
    }
    if (afdOpt.values[key].includes("*")) {
      finalNode = key;
    }

    nodes.add(nodeOptions);
  });

  // Agregar las transiciones (aristas) basadas en los símbolos del alfabeto con IDs únicos
  Object.keys(afdOpt)
    .filter((key) => key !== "states" && key !== "values")
    .forEach((symbol) => {
      Object.keys(afdOpt[symbol]).forEach((fromState) => {
        const toState = afdOpt[symbol][fromState];
        if (toState) {
          const edgeId = `${fromState}-${toState}-${symbol}`; // ID único para las aristas
          edges.add({
            id: edgeId, // ID único
            from: fromState,
            to: Object.keys(afdOpt.states).find(
              (key) => afdOpt.states[key] === toState
            ),
            label: symbol,
            arrows: { to: { enabled: true } },
          });
        }
      });
    });

  // Si existe un nodo inicial, agregar un nodo invisible apuntando a él
  if (initialNode !== null) {
    nodes.add({
      id: "invisible", // Nodo invisible
      label: "",
      shape: "circle",
      size: 1, // Tamaño muy pequeño
      color: { background: "rgba(0, 0, 0, 0)", border: "rgba(0, 0, 0, 0)" },
    });

    edges.add({
      from: "invisible",
      to: initialNode,
      label: "start",
      color: { color: "#5DADE2" },
      arrows: { to: { enabled: true } },
    });
  }

  // Crear el grafo en el contenedor `network-afdopt`
  const container = document.getElementById("network-afdopt");
  const networkData = { nodes: nodes, edges: edges };

  const options = {
    nodes: {
      shape: "circle",
      size: 20,
      color: { background: "#89CFF0", border: "#5DADE2" },
      font: { size: 30 },
    },
    edges: { arrows: { to: { enabled: true } }, length: 200 },
    physics: { enabled: true },
  };

  console.log("Nodos en AFD Óptimo:", nodes.get());
  console.log("Aristas en AFD Óptimo:", edges.get());

  afdOptGraph = new vis.Network(container, networkData, options);
}

function graficarAFDNop(data) {
  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();

  // Identificadores para los nodos iniciales y finales
  let initialNode = null;
  let finalNode = null;

  const afdNopStates = Object.keys(data.AFDnop.states);
  const alphabet =
    data.alphabet ||
    Object.keys(data.AFDnop).filter((k) => k !== "states" && k !== "values"); // Extraer el alfabeto

  afdNopStates.forEach((key) => {
    let nodeOptions = {
      id: key,
      label:
        `${data.AFDnop.states[key]}` +
        (data.AFDnop.values[key].includes("->") ? "" : "") +
        (data.AFDnop.values[key].includes("*") ? "" : ""),
      shape: data.AFDnop.values[key].includes("*") ? "box" : "circle",
      borderWidth: data.AFDnop.values[key].includes("*") ? 4 : 1, // Borde más ancho para el nodo final
    };

    if (data.AFDnop.values[key].includes("->")) {
      initialNode = key;
    }
    if (data.AFDnop.values[key].includes("*")) {
      finalNode = key;
    }

    nodes.add(nodeOptions);
  });

  // Agregar transiciones (aristas) según el alfabeto con IDs únicos
  alphabet.forEach((symbol) => {
    Object.keys(data.AFDnop[symbol]).forEach((fromState) => {
      const toState = data.AFDnop[symbol][fromState];
      if (toState) {
        const edgeId = `${fromState}-${toState}-${symbol}`; // ID único para las aristas
        edges.add({
          id: edgeId, // ID único
          from: fromState,
          to: Object.keys(data.AFDnop.states).find(
            (key) => data.AFDnop.states[key] === toState
          ),
          label: symbol,
          arrows: {
            to: { enabled: true },
          },
        });
      }
    });
  });

  // Si existe un nodo inicial, agregar un nodo invisible apuntando a él
  if (initialNode !== null) {
    nodes.add({
      id: "invisible", // Nodo invisible
      label: "", // Sin etiqueta
      shape: "circle",
      size: 1, // Tamaño muy pequeño
      color: {
        background: "rgba(0, 0, 0, 0)", // Fondo transparente
        border: "rgba(0, 0, 0, 0)", // Borde transparente
      },
    });

    edges.add({
      from: "invisible",
      to: initialNode,
      label: "start",
      arrows: "to", // Flecha apuntando al nodo inicial
      color: {
        color: "#5DADE2", // Color de la flecha
        opacity: 1, // Hacer visible la flecha
      },
    });
  }

  const container = document.getElementById("network-afdnop"); // Asegúrate de que este sea el contenedor correcto
  const networkData = {
    nodes: nodes,
    edges: edges,
  };

  const options = {
    nodes: {
      shape: "circle",
      size: 20,
      color: { background: "#89CFF0", border: "#5DADE2" },
      font: {
        size: 30,
      },
    },
    edges: {
      arrows: {
        to: { enabled: true },
      },
      length: 200,
    },
    physics: {
      enabled: true,
    },
  };

  console.log("Nodos en AFD No Óptimo:", nodes.get());
  console.log("Aristas en AFD No Óptimo:", edges.get());

  afdNopGraph = new vis.Network(container, networkData, options);
}

function mostrarIdenticos(data) {
  const identicos = data.identical || [];
  const identicalDiv = document.getElementById("identical-states");
  identicalDiv.innerHTML = ""; // Limpiar cualquier texto anterior

  if (identicos.length > 0) {
    let identicosHTML = `<h3>Identical States</h3><ul>`;
    identicos.forEach((entry) => {
      identicosHTML += `<li>${entry}</li>`;
    });
    identicosHTML += `</ul>`;
    identicalDiv.innerHTML = identicosHTML;
  } else {
    identicalDiv.innerHTML = `<h3>No identical states found.</h3>`;
  }
}

/*
// Función para avanzar el recorrido de AFD No Óptimo
function nextStepNop() {
  if (currentIndexNop < currentTransitionsNop.length) {
    const transition = currentTransitionsNop[currentIndexNop];

    // Paso 1: Resaltar nodo de inicio
    if (currentStepNop === 0) {
      highlightNode(afdNopGraph, nodeIdMapNop, transition.node1,1000);
      currentStepNop++;
    }

    // Paso 2: Resaltar arista
    else if (currentStepNop === 1) {
      highlightEdge(
        afdNopGraph,
        nodeIdMapNop,
        transition.node1,
        transition.node2,
        1000
      );
      currentStepNop++;
    }

    // Paso 3: Resaltar nodo de destino
    else if (currentStepNop === 2) {
      highlightNode(afdNopGraph, nodeIdMapNop, transition.node2,1000);
      currentStepNop = 0;
      currentIndexNop++;
    }
  } else {
    console.log("Recorrido en AFD No Óptimo completado");
  }
}

// Función para avanzar el recorrido de AFD Óptimo
function nextStepOpt() {
  if (currentIndexOpt < currentTransitionsOpt.length) {
    const transition = currentTransitionsOpt[currentIndexOpt];

    // Paso 1: Resaltar nodo de inicio
    if (currentStepOpt === 0) {
      highlightNode(afdOptGraph, nodeIdMapOpt, transition.node1,1000);
      currentStepOpt++;
    }

    // Paso 2: Resaltar arista
    else if (currentStepOpt === 1) {
      highlightEdge(
        afdOptGraph,
        nodeIdMapOpt,
        transition.node1,
        transition.node2,
        1000
      );
      currentStepOpt++;
    }

    // Paso 3: Resaltar nodo de destino
    else if (currentStepOpt === 2) {
      highlightNode(afdOptGraph, nodeIdMapOpt, transition.node2,1000);
      currentStepOpt = 0;
      currentIndexOpt++;
    }
  } else {
    console.log("Recorrido en AFD Óptimo completado");
  }
}
*/
