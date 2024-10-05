document.getElementById("submitBtn").addEventListener("click", function () {
    const regexInput = document.getElementById("regexInput").value;
    

    // Corregir la URL en el fetch
    fetch(`http://localhost:3600/api1/${regexInput}`)
        .then(response => response.json())
        .then(data => {
            /*AQUI LAS LLAMAS*/
            graficarGrafo(data);
            TableThompson(data);
            TableAFDNop(data);
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
    const tablesDiv = document.getElementById('thompson-table');
    tablesDiv.innerHTML = ''; // Limpiar tablas anteriores

    const transitionTable = data.Transition_table;

    // Corregir el uso de plantillas literales para generar HTML
    let transitionTableHTML = `
        <table>
            <thead>
                <tr>
                    <th>States</th>
                    ${Object.keys(transitionTable).map(input => `<th>${input}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${Object.keys(transitionTable[Object.keys(transitionTable)[0]]).map(state => `
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

    tablesDiv.innerHTML += transitionTableHTML;
}

function TableAFDNop(data) {
    const afdNop = data.AFDnop;
    const T = data.T;  
    const alphabet = Object.keys(afdNop).filter(key => key !== 'states' && key !== 'values'); // Extraer dinámicamente el alfabeto
    const tablesDiv = document.getElementById('afdnop-table');
    tablesDiv.innerHTML = ''; // Limpiar tablas anteriores

    // Crear la tabla de transiciones
    let afdTableHTML = `
        <h3>Transitions</h3>
        <table>
            <thead>
                <tr>
                    <th>State</th>
                    <th>Value</th>
                    ${alphabet.map(symbol => `<th>${symbol}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${Object.keys(afdNop.states).map(key => `
                    <tr>
                        <td>${afdNop.values[key]} ${afdNop.states[key]}</td>
                        <td>${afdNop.values[key]}</td>
                        ${alphabet.map(symbol => `<td>${afdNop[symbol][key] || '-'}</td>`).join('')}
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
                        <td>${entry[0]}</td>
                        <td>{${entry[1].join(', ')}}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    tablesDiv.innerHTML = afdTableHTML + tTableHTML; // Mostrar ambas tablas
}
