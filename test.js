const fs = require('fs');
const parser = require('./analizadorWison');
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
    }
    catch (error)
    {
        console.error("ERROR SINTÁCTICO O LÉXICO:");
        console.error(error.message);
    }
});