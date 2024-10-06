document.getElementById("submitBtn").addEventListener("click", function () {
    const regexInput = document.getElementById("regexInput").value;

    // Ocultar los gráficos y tablas al hacer clic en el botón, en caso de que sean visibles
    document.querySelectorAll(".container-graph-table").forEach(function (element) {
        element.classList.add("hidden");
    });


    // Corregir la URL en el fetch
    fetch(`http://localhost:3600/api1/${regexInput}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }
            return response.json();
        })
        .then(data => {
            // Graficar y mostrar datos solo después de que los datos se hayan cargado
            graficarGrafo(data);  // Graficar Thompson
            graficarAFDNop(data); // Graficar AFD no óptimo (con los datos correctos)
            graficarAFDOpt(data); // Graficar AFD óptimo
            TableThompson(data);  // Mostrar tabla de Thompson
            TableAFDNop(data);    // Mostrar tabla del AFD no óptimo
            TableAFDOpt(data);    // Mostrar tabla del AFD óptimo

            mostrarIdenticos(data);   // Mostrar los estados idénticos
            mostrarSimbolos(regexInput);

            // Volver a mostrar los gráficos y tablas una vez que se han cargado
            document.querySelectorAll(".container-graph-table").forEach(function (element) {
                element.classList.remove("hidden");
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar los datos. Verifica la expresión regular o el servidor.');
        });
});


function mostrarSimbolos(regex) {
    const simbolosDiv = document.getElementById('simbolos'); // ID del contenedor donde se mostrarán los símbolos

    // Crear un Set para almacenar los símbolos únicos
    let simbolosSet = new Set();

    // Recorrer la expresión regular y agregar solo los símbolos válidos (ej. letras a-z)
    for (let char of regex) {
        if (/[a-zA-Z]/.test(char)) {  // Filtrar solo letras (puedes ajustar esto si tu alfabeto incluye otros símbolos)
            simbolosSet.add(char);
        }
    }

    // Convertir el Set a un array y luego a un string en formato {a, b, ...}
    let simbolosArray = Array.from(simbolosSet).sort(); // Ordenar alfabéticamente
    let simbolosString = `Σ = {${simbolosArray.join(', ')}}`;

    // Mostrar el texto en el contenedor
    simbolosDiv.innerHTML = `
        <h3>Symbols</h3>
        <p>${simbolosString}</p>
    `;
}


function graficarGrafo(data) {
    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();

    // Identificadores para los nodos iniciales y finales
    let initialNode = null;
    let finalNode = null;

    data.graph.nodes.forEach(node => {
        let nodeOptions = {
            id: node.tag,
            label: `Node ${node.tag}` + (node.initial ? ' (Inicial)' : '') + (node.final ? ' (Final)' : ''),
            shape: node.final ? 'box' : 'circle',
            borderWidth: node.final ? 4 : 1 // Borde más ancho para el nodo final
        };

        // Guardamos el nodo inicial y final
        if (node.initial) {
            initialNode = node.tag;
        }
        if (node.final) {
            finalNode = node.tag;
        }

        nodes.add(nodeOptions);
    });

    // Agregar las aristas (edges) del grafo
    data.graph.nodes.forEach(node => {
        node.adj.forEach(adj => {
            edges.add({
                from: node.tag,
                to: adj[0],
                label: '&'
            });
        });
    });

    // Si existe un nodo inicial, agregamos un nodo invisible apuntando a él
    if (initialNode !== null) {
        nodes.add({
            id: 'invisible',   // Nodo invisible
            label: 'start',         // Sin etiqueta
            shape: 'circle',
            size: 1,           // Tamaño pequeño (prácticamente invisible)
            color: {
                background: 'rgba(0, 0, 0, 0)',  // Fondo transparente
                border: 'rgba(0, 0, 0, 0)'       // Borde transparente
            }
        });

        edges.add({
            from: 'invisible',
            to: initialNode,
            arrows: 'to',       // Flecha apuntando al nodo inicial
            color: {
                color: 'blue',  // Color de la flecha (puedes cambiarlo si lo prefieres invisible)
                opacity: 1         // Hacer visible la flecha
            }
        });
    }

    // Crear el grafo en el contenedor 'network-thompson'
    const container = document.getElementById('network-thompson');
    const networkData = {
        nodes: nodes,
        edges: edges
    };

    const options = {
        nodes: {
            shape: 'circle',
            size: 20,
            font: {
                size: 16
            }
        },
        edges: {
            arrows: {
                to: { enabled: true }
            },
            length: 200
        },
        physics: {
            enabled: true
        }
    };

    new vis.Network(container, networkData, options);
}


function TableThompson(data) {
    const transitionTable = data.Transition_table;
    const tablesDiv = document.getElementById('thompson-table');
    tablesDiv.innerHTML = ''; // Limpiar tablas anteriores

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
                    ${Object.keys(transitionTable).map(input => `<th>${input}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${Object.keys(transitionTable["&"]).map(state => `
                    <tr>
                        <td>${state}</td>
                        ${Object.keys(transitionTable).map(input => `
                            <td>${transitionTable[input][state].length > 0 ? transitionTable[input][state].join(', ') : '-'}</td>
                        `).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    tablesDiv.innerHTML = transitionTableHTML;
}
function TableAFDNop(data) {
    const afdNop = data.AFDnop;  // Datos del AFD no óptimo
    const T = data.T;  // Transiciones de estados
    const alphabet = data.alphabet || Object.keys(afdNop).filter(k => k !== 'states' && k !== 'values');  // Extraer alfabeto desde los datos o usar uno proporcionado
    const tablesDiv = document.getElementById('afdnop-table');  // ID del contenedor de la tabla
    tablesDiv.innerHTML = ''; 

    if (!afdNop || !T) {
        console.error("No hay datos para la tabla del AFD no óptimo");
        return;
    }

    // Crear la tabla de transiciones del AFD no óptimo
    let afdTableHTML = `
        <h3>Transitions (AFD No Óptimo)</h3>
        <table>
            <thead>
                <tr>
                    <th>State</th>
                    ${alphabet.map(symbol => `<th>${symbol}</th>`).join('')}  <!-- Mostrar las columnas para cada símbolo -->
                </tr>
            </thead>
            <tbody>
                ${Object.keys(afdNop.states).map(key => `
                    <tr>
                        <td>${afdNop.values[key]}${afdNop.states[key]}</td> <!-- Estado y Valor concatenados -->
                        ${alphabet.map(symbol => `<td>${afdNop[symbol][key] || '-'}</td>`).join('')}  <!-- Transiciones para cada símbolo -->
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Crear la segunda tabla (Estados equivalentes de NFA)
    let tTableHTML = `
        <h3>T</h3>
        <table>
            <thead>
                <tr>
                    <th>State</th>
                    <th>NFA equivalent states</th>
                </tr>
            </thead>
            <tbody>
                ${T.map(entry => `
                    <tr>
                        <td>${entry[0]}</td> <!-- Estado -->
                        <td>{${entry[1].join(', ')}}</td> <!-- Estados equivalentes en el NFA -->
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Mostrar ambas tablas
    tablesDiv.innerHTML = afdTableHTML + tTableHTML;
}
function graficarAFDNop(data) {
    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();

    // Identificadores para los nodos iniciales y finales
    let initialNode = null;
    let finalNode = null;

    const afdNopStates = Object.keys(data.AFDnop.states);
    const alphabet = data.alphabet || Object.keys(data.AFDnop).filter(k => k !== 'states' && k !== 'values');  // Extraer el alfabeto

    afdNopStates.forEach(key => {
        let nodeOptions = {
            id: key,
            label: `Node ${data.AFDnop.states[key]}` + (data.AFDnop.values[key].includes('->') ? ' (Inicial)' : '') + (data.AFDnop.values[key].includes('*') ? ' (Final)' : ''),
            shape: data.AFDnop.values[key].includes('*') ? 'box' : 'circle',
            borderWidth: data.AFDnop.values[key].includes('*') ? 4 : 1 // Borde más ancho para el nodo final
        };

        if (data.AFDnop.values[key].includes('->')) {
            initialNode = key;
        }
        if (data.AFDnop.values[key].includes('*')) {
            finalNode = key;
        }

        nodes.add(nodeOptions);
    });

    // Agregar transiciones (aristas) según el alfabeto
    alphabet.forEach(symbol => {
        Object.keys(data.AFDnop[symbol]).forEach(fromState => {
            const toState = data.AFDnop[symbol][fromState];
            edges.add({
                from: fromState,
                to: Object.keys(data.AFDnop.states).find(key => data.AFDnop.states[key] === toState),
                label: symbol,
                color: {
                    color: 'blue' // Flecha azul
                },
                arrows: {
                    to: { enabled: true }
                }
            });
        });
    });

    // Si existe un nodo inicial, agregar un nodo invisible apuntando a él
    if (initialNode !== null) {
        nodes.add({
            id: 'invisible',   // Nodo invisible
            label: 'start',         // Sin etiqueta
            shape: 'circle',
            size: 1,           // Tamaño muy pequeño
            color: {
                background: 'rgba(0, 0, 0, 0)',  // Fondo transparente
                border: 'rgba(0, 0, 0, 0)'       // Borde transparente
            }
        });

        edges.add({
            from: 'invisible',
            to: initialNode,
            arrows: 'to',       // Flecha apuntando al nodo inicial
            color: {
                color: 'blue',  // Flecha negra
                opacity: 1         // Visible
            }
        });
    }

    const container = document.getElementById('network-afdnop');  // Asegúrate de que este sea el contenedor correcto
    const networkData = {
        nodes: nodes,
        edges: edges
    };

    const options = {
        nodes: {
            shape: 'circle',
            size: 20,
            font: {
                size: 16
            }
        },
        edges: {
            arrows: {
                to: { enabled: true }
            },
            length: 200
        },
        physics: {
            enabled: true
        }
    };

    new vis.Network(container, networkData, options);
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
    Object.keys(afdOpt.states).forEach(key => {
        let nodeOptions = {
            id: key,
            label: `Node ${afdOpt.states[key]}` + 
                   (afdOpt.values[key].includes('->') ? ' (Inicial)' : '') + 
                   (afdOpt.values[key].includes('*') ? ' (Final)' : ''),
            shape: afdOpt.values[key].includes('*') ? 'box' : 'circle',
            borderWidth: afdOpt.values[key].includes('*') ? 4 : 1 // Borde más ancho para el nodo final
        };

        if (afdOpt.values[key].includes('->')) {
            initialNode = key;
        }
        if (afdOpt.values[key].includes('*')) {
            finalNode = key;
        }

        nodes.add(nodeOptions);
    });

    // Agregar las transiciones basadas en los símbolos del alfabeto
    Object.keys(afdOpt).filter(key => key !== 'states' && key !== 'values').forEach(symbol => {
        Object.keys(afdOpt[symbol]).forEach(fromState => {
            const toState = afdOpt[symbol][fromState];
            if (toState) {  // Verificar que la transición exista
                edges.add({
                    from: fromState,
                    to: Object.keys(afdOpt.states).find(key => afdOpt.states[key] === toState),
                    label: symbol,
                    color: {
                        color: 'blue' // Flecha azul
                    },
                    arrows: {
                        to: { enabled: true }
                    }
                });
            }
        });
    });

    // Si existe un nodo inicial, agregar un nodo invisible apuntando a él
    if (initialNode !== null) {
        nodes.add({
            id: 'invisible',   // Nodo invisible
            label: 'start',         // Sin etiqueta
            shape: 'circle',
            size: 1,           // Tamaño muy pequeño
            color: {
                background: 'rgba(0, 0, 0, 0)',  // Fondo transparente
                border: 'rgba(0, 0, 0, 0)'       // Borde transparente
            }
        });

        edges.add({
            from: 'invisible',
            to: initialNode,
            arrows: 'to',       // Flecha apuntando al nodo inicial
            color: {
                color: 'blue',  // Flecha negra
                opacity: 1         // Visible
            }
        });
    }

    // Crear el grafo en el contenedor `network-afdopt`
    const container = document.getElementById('network-afdopt');
    const networkData = {
        nodes: nodes,
        edges: edges
    };

    const options = {
        nodes: {
            shape: 'circle',
            size: 20,
            font: {
                size: 16
            }
        },
        edges: {
            arrows: {
                to: { enabled: true }
            },
            length: 200
        },
        physics: {
            enabled: true
        }
    };

    new vis.Network(container, networkData, options);
}


function TableAFDOpt(data) {
    const afdOpt = data.AFDop; // Datos del AFD óptimo
    const alphabet = Object.keys(afdOpt).filter(key => key !== 'states' && key !== 'values'); // Detectar dinámicamente el alfabeto
    const tablesDiv = document.getElementById('afdopt-table'); // ID del contenedor de la tabla
    const significativos = data.states || []; // Los estados significativos están en data.states

    tablesDiv.innerHTML = ''; // Limpiar tablas anteriores

    // Verificar que los datos necesarios existen
    if (!afdOpt) {
        console.error("No hay datos para la tabla del AFD óptimo");
        return;
    }

    // Crear la tabla de transiciones del AFD óptimo
    let afdTableHTML = `
        <h3>Transitions (AFD Óptimo)</h3>
        <table border="1" cellpadding="5" cellspacing="0">
            <thead>
                <tr>
                    <th>State</th>
                    ${alphabet.map(symbol => `<th>${symbol}</th>`).join('')} <!-- Mostrar las columnas para cada símbolo -->
                </tr>
            </thead>
            <tbody>
                ${Object.keys(afdOpt.states).map(key => `
                    <tr>
                        <td>${afdOpt.values[key]}${afdOpt.states[key]}</td> <!-- Estado y Valor concatenados -->
                        ${alphabet.map(symbol => `<td>${afdOpt[symbol][key] || '-'}</td>`).join('')} <!-- Transiciones para cada símbolo -->
                    </tr>
                `).join('')}
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
                ${significativos.map(entry => `
                    <tr>
                        <td>Significants(${entry[0]})</td>
                        <td>{${entry[1].join(', ')}}</td> <!-- Mostrar los estados significativos -->
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Mostrar ambas tablas
    tablesDiv.innerHTML = afdTableHTML + sigStatesHTML;
}

function mostrarIdenticos(data) {
    const identicos = data.identical || [];
    const identicalDiv = document.getElementById('identical-states');
    identicalDiv.innerHTML = ''; // Limpiar cualquier texto anterior

    if (identicos.length > 0) {
        let identicosHTML = `<h3>Identical States</h3><ul>`;
        identicos.forEach(entry => {
            identicosHTML += `<li>${entry}</li>`;
        });
        identicosHTML += `</ul>`;
        identicalDiv.innerHTML = identicosHTML;
    } else {
        identicalDiv.innerHTML = `<h3>No identical states found.</h3>`;
    }
}
