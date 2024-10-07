// Recibiendo datos
const data = {
    "sussefull": true,
    "transitions": [
        { "node1": "A", "node2": "B", "chart": "a" },
        { "node1": "B", "node2": "C", "chart": "b" },
        { "node1": "C", "node2": "C", "chart": "c" },
        { "node1": "C", "node2": "C", "chart": "c" }
    ]
};

// Crear nodos únicos
const nodesArray = [];
const edgesArray = [];

// Crear nodos y aristas
data.transitions.forEach(transition => {
    // Añadir nodos si no existen
    if (!nodesArray.find(n => n.id === transition.node1)) {
        nodesArray.push({ id: transition.node1, label: transition.node1 });
    }
    if (!nodesArray.find(n => n.id === transition.node2)) {
        nodesArray.push({ id: transition.node2, label: transition.node2 });
    }

    // Añadir aristas (transiciones)
    edgesArray.push({
        from: transition.node1,
        to: transition.node2,
        label: transition.chart
    });
});

// Configurar Vis.js
const container = document.getElementById('mynetwork');
const nodes = new vis.DataSet(nodesArray);
const edges = new vis.DataSet(edgesArray);

const dataVis = {
    nodes: nodes,
    edges: edges
};

const options = {
    nodes: {
        shape: 'dot',
        size: 16
    },
    edges: {
        arrows: 'to',
        font: {
            align: 'top'
        }
    }
};

const network = new vis.Network(container, dataVis, options);

// Función para cambiar el color de un nodo
function highlightNode(nodeId) {
    nodes.update({ id: nodeId, color: { background: 'red', border: 'black' } });
}

function resetNode(nodeId) {
    nodes.update({ id: nodeId, color: { background: '#97C2FC', border: '#2B7CE9' } });
}

// Función para hacer el recorrido dinámico
function startTraversal() {
    let currentNode = "A"; // Nodo inicial
    let delay = 1000; // Retraso entre cambios (en milisegundos)

    data.transitions.forEach((transition, index) => {
        setTimeout(() => {
            highlightNode(transition.node1); // Resaltar nodo de inicio
            setTimeout(() => {
                resetNode(transition.node1); // Restaurar color después del retraso
                highlightNode(transition.node2); // Resaltar nodo de destino
            }, delay / 2);
        }, index * delay);
    });
}
