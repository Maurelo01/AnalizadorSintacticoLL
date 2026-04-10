const express = require('express');
const cors = require('cors');
const Lexer = require('./Lexer');
const parser = require('./analizadorWison');
const GestorGramatica = require('./GestorGramatica');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/compilar', (req, res) => 
{
    const { codigoWison, textoPrueba } = req.body;
    if (!codigoWison || !textoPrueba)
    {
        return res.status(400).json({ error: 'Faltan campos: codigoWison y textoPrueba son requeridos.' });
    }
    try
    {
        const ast = parser.parse(codigoWison);
        const gestorGramatica = new GestorGramatica(ast);
        if (gestorGramatica.errores.length > 0)
        {
            return res.status(400).json({ error: 'Errores en la gramática', detalles: gestorGramatica.errores });
        }
        gestorGramatica.calcularFirsts();
        gestorGramatica.calcularFollows();
        gestorGramatica.generarTablaParser();
        if (gestorGramatica.errores.length > 0)
        {
            return res.status(400).json({ error: 'Errores en la gramática', detalles: gestorGramatica.errores });
        }
        let firstsJSON = {};
        for (let [nt, conjunto] of gestorGramatica.firsts)
        {
            firstsJSON[nt] = Array.from(conjunto);
        }
        let followsJSON = {};
        for (let [nt, conjunto] of gestorGramatica.follows)
        {
            followsJSON[nt] = Array.from(conjunto);
        }
        let tasJSON = {};
        for (let [nt, fila] of gestorGramatica.tablaTAS)
        {
            tasJSON[nt] = {};
            for (let [terminal, alternativa] of fila)
            {
                tasJSON[nt][terminal] = alternativa.length === 0 ? "ε" : alternativa.map(s => s.id).join(" ");
            }
        }
        const escaner = new Lexer(gestorGramatica.terminales);
        let listaTokens = escaner.generarTokens(textoPrueba);
        let resultadoAnalisis = gestorGramatica.analizarCadenaConPila(listaTokens);
        res.json({ exito: resultadoAnalisis.exito, errores: gestorGramatica.errores, firsts: firstsJSON, follows: followsJSON, tablaTAS: tasJSON, arbol: resultadoAnalisis.arbol, tokens: listaTokens.map(t => `<${t.id}, '${t.lexema}'>`)});
    }
    catch (error)
    {
        console.error("Error en compilación:", error.message);
        res.json({ exito: false, errores: [error.message] });
    }
});

app.listen(PORT, () => 
{
    console.log(`API Compilador wison corriendo en puerto ${PORT}`);
    console.log(`URL para Angular: http://localhost:${PORT}/api/compilar`);
    console.log(`Esperando peticiones...`);
});