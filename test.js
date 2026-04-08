const fs = require('fs');
const parser = require('./analizadorWison');
const GestorGramatica = require('./GestorGramatica');
const archivo = process.argv[2] || 'prueba.txt';

fs.readFile(archivo, 'utf8', (err, data) =>
{
    if (err)
    {
        return console.error('Error al leer el archivo:', err);
    }
    try
    {
        const ast = parser.parse(data);
        console.log("ANÁLISIS EXITOSO");
        console.log(JSON.stringify(ast, null, 2));
        const gestorGramatica = new GestorGramatica(ast);
        gestorGramatica.mostrarTablaSimbolos();
        gestorGramatica.mostrarErrores();
        if (gestorGramatica.errores.length === 0)
        {
            gestorGramatica.calcularFirsts();
            gestorGramatica.mostrarFirsts();
        }
    }
    catch (error)
    {
        console.error("ERROR SINTÁCTICO O LÉXICO:");
        console.error(error.message);
    }
});