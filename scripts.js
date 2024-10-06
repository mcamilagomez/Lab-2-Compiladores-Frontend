document.getElementById("submitBtn").addEventListener("click", function () {
    const regexInput = document.getElementById("regexInput").value;
    

    // Corregir la URL en el fetch
    fetch(`http://localhost:3600/api1/${regexInput}`)
        .then(response => response.json())
        .then(data => {
            graficarGrafo(data);  // Graficar Thompson
            graficarAFDNop(data); // Graficar AFD no óptimo (con los datos correctos)
            graficarAFDOpt(data); // Graficar AFD óptimo
            TableThompson(data);  // Mostrar tabla de Thompson
            TableAFDNop(data);    // Mostrar tabla del AFD no óptimo
            TableAFDOpt(data);    // Mostrar tabla del AFD óptimo
        })
        .catch(error => console.error('Error:', error));
});

function graficarGrafo(data) {
    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();

    data.graph.nodes.forEach(node => {
        nodes.add({
            id: node.tag,
            label: `Node ${node.tag}` + (node.initial ? ' (Inicial)' : '') + (node.final ? ' (Final)' : ''),
            shape: node.final ? 'box' : 'circle'
        });
    });

    // Agregar aristas
    data.graph.nodes.forEach(node => {
        node.adj.forEach(adj => {
            edges.add({
                from: node.tag,
                to: adj[0],
                label: '&'
            });
        });
    });

    // Crear el grafo
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
    const afdNop = data.AFDnop; // Datos del AFD no óptimo
    const T = data.T;  // Transiciones de estados
    const alphabet = ["a", "b"]; // Asumimos que el alfabeto es "a" y "b"
    const tablesDiv = document.getElementById('afdnop-table'); // ID del contenedor de la tabla
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
                    ${alphabet.map(symbol => `<th>${symbol}</th>`).join('')} <!-- Mostrar las columnas para cada símbolo -->
                </tr>
            </thead>
            <tbody>
                ${Object.keys(afdNop.states).map(key => `
                    <tr>
                        <td>${afdNop.values[key]}${afdNop.states[key]}</td> <!-- Estado y Valor concatenados -->
                        ${alphabet.map(symbol => `<td>${afdNop[symbol][key] || '-'}</td>`).join('')} <!-- Transiciones para cada símbolo -->
                    </tr>
                `).join('')}
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

    // Aquí utilizamos los datos del AFD no óptimo (AFDnop) en lugar de los de Thompson
    const afdNopStates = Object.keys(data.AFDnop.states);

    afdNopStates.forEach(key => {
        nodes.add({
            id: key,
            label: `Node ${data.AFDnop.states[key]}` + (data.AFDnop.values[key].includes('->') ? ' (Inicial)' : '') + (data.AFDnop.values[key].includes('*') ? ' (Final)' : ''),
            shape: data.AFDnop.values[key].includes('*') ? 'box' : 'circle'
        });
    });

    // Agregar transiciones (aristas) según el alfabeto
    ["a", "b"].forEach(symbol => {
        Object.keys(data.AFDnop[symbol]).forEach(fromState => {
            const toState = data.AFDnop[symbol][fromState];
            edges.add({
                from: fromState,
                to: Object.keys(data.AFDnop.states).find(key => data.AFDnop.states[key] === toState),
                label: symbol
            });
        });
    });

    const container = document.getElementById('network-afdnop'); // Asegúrate de que este sea el contenedor correcto
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

    // Suponiendo que los datos para el grafo del AFD óptimo están en `data.AFDop`
    // Ajusta esta estructura a la que recibes del servidor si es necesario.
    const afdOpt = data.AFDop;
    
    Object.keys(afdOpt.states).forEach(key => {
        nodes.add({
            id: key,
            label: `Node ${afdOpt.states[key]}` + (afdOpt.values[key].includes('->') ? ' (Inicial)' : '') + (afdOpt.values[key].includes('*') ? ' (Final)' : ''),
            shape: afdOpt.values[key].includes('*') ? 'box' : 'circle'
        });
    });

    // Agregar las transiciones basadas en los símbolos del alfabeto
    Object.keys(afdOpt).filter(key => key !== 'states' && key !== 'values').forEach(symbol => {
        Object.keys(afdOpt[symbol]).forEach(fromState => {
            const toState = afdOpt[symbol][fromState];
            edges.add({
                from: fromState,
                to: Object.keys(afdOpt.states).find(key => afdOpt.states[key] === toState),
                label: symbol
            });
        });
    });

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
    const alphabet = ["a", "b"]; // Asumimos que el alfabeto es "a" y "b"
    const tablesDiv = document.getElementById('afdopt-table'); // ID del contenedor de la tabla
    tablesDiv.innerHTML = ''; // Limpiar tablas anteriores

    // Verificar que los datos necesarios existen
    if (!afdOpt) {
        console.error("No hay datos para la tabla del AFD óptimo");
        return;
    }

    // Crear la tabla de transiciones del AFD óptimo
    let afdTableHTML = `
        <h3>Transitions (AFD Óptimo)</h3>
        <table>
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

    // Mostrar la tabla
    tablesDiv.innerHTML = afdTableHTML;
}
