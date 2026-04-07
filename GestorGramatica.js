class GestorGramatica
{
    constructor(ast)
    {
        this.ast = ast;
        this.simboloInicial = null;
        this.producciones = new Map();
        this.terminales = new Map();
        this.noTerminales = new Set();
        this.errores = [];

        
    }

    generarTablaSimbolos()
    {
        // Léxico  
        this.ast.lexico.forEach(token =>
        {
            if (this.terminales.has(token.id))
            {
                this.errores.push(`Error semántico: El terminal ${token.id} ya fue declarado.`);
            }
            else
            {
                this.terminales.set(token.id, token.expresion);
            }
        });

        // Sintáctico - declaraciones
        this.ast.sintactico.forEach(instruccion =>
        {
            if (instruccion.tipo === "NO_TERMINAL")
            {
                if (this.noTerminales.has(instruccion.id))
                {
                    this.errores.push(`Error semántico: El no terminal ${instruccion.id} ya fue declarado.`);
                }
                else
                {
                    this.noTerminales.add(instruccion.id);
                }
            }
            else if (instruccion.tipo === "INITIAL_SIM")
            {
                if (this.simboloInicial)
                {
                    this.errores.push(`Error semántico: Ya existe un símbolo inicial definido (${this.simboloInicial}).`);
                }
                else
                {
                    this.simboloInicial = instruccion.id;
                }
            }
        });

        // Sintáctico - producciones
        this.ast.sintactico.forEach(instruccion =>
        {
            if (instruccion.tipo === "PRODUCCION")
            {
                // Validar que la cabeza fue declarada
                if (!this.noTerminales.has(instruccion.cabeza))
                {
                    this.errores.push(`Error semántico: El no terminal ${instruccion.cabeza} no fue declarado antes de usarse.`);
                }
                // Validar cada símbolo del cuerpo
                instruccion.alternativas.forEach(alternativa =>
                {
                    alternativa.forEach(simbolo =>
                    {
                        if (simbolo.tipo === "TERMINAL" && !this.terminales.has(simbolo.id))
                        {
                            this.errores.push(`Error semántico: El terminal ${simbolo.id} no fue declarado.`);
                        }
                        else if (simbolo.tipo === "NO_TERMINAL" && !this.noTerminales.has(simbolo.id))
                        {
                            this.errores.push(`Error semántico: El no terminal ${simbolo.id} no fue declarado antes de usarse.`);
                        }
                    });
                });
                if (!this.producciones.has(instruccion.cabeza))
                {
                    this.producciones.set(instruccion.cabeza, []);
                }
                let alternativasActuales = this.producciones.get(instruccion.cabeza);
                this.producciones.set(instruccion.cabeza, alternativasActuales.concat(instruccion.alternativas));
            }
        });
        // Confirma que el simbolo inicial fue definido
        if (!this.simboloInicial)
        {
            this.errores.push(`Error semántico: No se definió un símbolo inicial (Initial_Sim).`);
        }
    }

    mostrarTablaSimbolos()
    {
        console.log("--- TABLA DE SÍMBOLOS ---");
        console.log("Símbolo Inicial:", this.simboloInicial);
        console.log("\n--- Terminales ---");
        for (let [id, expr] of this.terminales)
        {
            console.log(` ${id} -> ${JSON.stringify(expr)}`);
        }
        console.log("\n--- No Terminales ---");
        for (let nt of this.noTerminales)
        {
            console.log(` ${nt}`);
        }
        console.log("\n--- Producciones ---");
        for (let [cabeza, alternativas] of this.producciones)
        {
            console.log(` ${cabeza} -> ${alternativas.length} alternativa(s)`);
        }
        if (this.errores.length > 0)
        {
            console.log("\n--- ERRORES ---");
            this.errores.forEach(e => console.error(" ", e));
        }
    }
}
module.exports = GestorGramatica;