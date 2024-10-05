document.getElementById("submitBtn").addEventListener("click", function () {
    const regexInput = document.getElementById("regexInput").value;
    document.getElementById("result").innerText = "Expresión regular guardada: " + regexInput;

    fetch(`http://localhost:3600/api1/${regexInput}`)
        .then(response => response.json())
        .then(data => {
            graficarGrafo(data);
            mostrarTablas(data);
            mostrarTexto(data);
            console.log(data);
        })
        .catch(error => console.error('Error:', error));
});

function graficarGrafo(data) {
    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();

    // Agregar nodos
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
                label: adj[1] || 'ε' // Usar 'ε' para transiciones epsilon
            });
        });
    });

    // Crear el grafo
    const container = document.getElementById('network');
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

    // Renderizar el grafo
    new vis.Network(container, networkData, options);
}

function mostrarTablas(data) {
    const tablesDiv = document.getElementById('tables');
    tablesDiv.innerHTML = ''; // Limpiar tablas anteriores

    /* esta es thompson, por alguna razon no me deja mostrar thompson y el no optimo al mismo tiempo
    const transitionTable = data.Transition_table;
    const transitionTableHTML = `
        <h3>Transition Table</h3>
        <table>
            <thead>
                <tr>
                    <th>States</th>
                    ${Object.keys(transitionTable).map(input => <th>${input}</th>).join('')}
                </tr>
            </thead>
            <tbody>
                ${Object.keys(transitionTable[Object.keys(transitionTable)[0]]).map(state => 
                    <tr>
                        <td>${state}</td>
                        ${Object.keys(transitionTable).map(input => 
                            <td>${transitionTable[input][state].length > 0 ? transitionTable[input][state].join(', ') : '-'}</td>
                        ).join('')}
                    </tr>
                ).join('')}
            </tbody>
        </table>
    `;
    tablesDiv.innerHTML += transitionTableHTML;
    */
    // Mostrar AFDnop
    const afdNopTable = data.AFDnop;
    const afdNopHTML = `
        <h3>AFD NOP Table</h3>
        <table>
            <thead>
                <tr>
                    <th>State</th>
                    <th>Value</th>
                    <th>a</th>
                    <th>b</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(afdNopTable.states).map(key => `
                    <tr>
                        <td>${afdNopTable.states[key]}</td>
                        <td>${afdNopTable.values[key]}</td>
                        <td>${afdNopTable.a[key] || ''}</td>
                        <td>${afdNopTable.b[key] || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    tablesDiv.innerHTML += afdNopHTML;

    // Mostrar T
    const tHTML = `
        <h3>Transitions T</h3>
        <table>
            <thead>
                <tr>
                    <th>State</th>
                    <th>Transitions</th>
                </tr>
            </thead>
            <tbody>
                ${data.T.map(row => `
                    <tr>
                        <td>${row[0]}</td>
                        <td>${row[1].join(', ')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    tablesDiv.innerHTML += tHTML;
}

function mostrarTexto(data) {
    const tablesDiv = document.getElementById('tables');

    // Mostrar el alfabeto
    const alphabetHTML = `<h3>Alfabeto</h3><p>${data.alphabet.join(', ')}</p>`;
    tablesDiv.innerHTML += alphabetHTML;

    // Mostrar estados idénticos
    if (data.identical.length > 0) {
        const identicalStatesHTML = `<h3>Estados Idénticos</h3><p>${data.identical.join('<br>')}</p>`;
        tablesDiv.innerHTML += identicalStatesHTML;
    }
}

