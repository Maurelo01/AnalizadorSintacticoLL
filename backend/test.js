const fs = require('fs');
const parser = require('./analizadorWison');
const GestorGramatica = require('./GestorGramatica');
const Lexer = require('./Lexer');
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
            gestorGramatica.calcularFollows();
            gestorGramatica.mostrarFollows()
            gestorGramatica.generarTablaParser();
            gestorGramatica.mostrarTAS();
            let textoDePrueba = "( a + a ) FIN"; 
            console.log(`\n--- PRUEBA DEL ESCÁNER Y PARSER ---`);
            console.log(`Texto de entrada: "${textoDePrueba}"`);
            const escaner = new Lexer(gestorGramatica.terminales);
            let listaTokens = escaner.generarTokens(textoDePrueba);
            console.log("\nTokens generados por el Lexer:");
            console.log(listaTokens.map(t => `<${t.id}, '${t.lexema}'>`).join("  "));
            let resultadoAnalisis = gestorGramatica.analizarCadenaConPila(listaTokens);
            if (resultadoAnalisis.exito)
            {
                console.log("\n--- JSON DEL ÁRBOL DE DERIVACIÓN ---");
                console.log(JSON.stringify(resultadoAnalisis.arbol, null, 2));
            }
        }
    }
    catch (error)
    {
        console.error("ERROR SINTÁCTICO O LÉXICO:");
        console.error(error.message);
    }
});