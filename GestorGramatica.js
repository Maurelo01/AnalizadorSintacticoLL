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
        this.generarTablaSimbolos();
        this.verificarRecursividadIzquierda();
        this.verificarFactorizacion();
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
    }

    imprimirErrores()
    {
        if (this.errores.length > 0)
        {
            console.log("\n--- ERRORES ---");
            this.errores.forEach(e => console.error(" ", e));
        }
        else
        {
            console.log("\n La gramática es apta para LL, sin recursividad por la izquierda.");
        }
    }

    verificarRecursividadIzquierda()
    {
        let hayRecursividad = false;
        // Recorre las producciones del mapa (recusividad directa)
        for (let [cabeza, alternativas] of this.producciones)
        {
            // Revisa cada alternativa de la cabeza
            alternativas.forEach((alternativa, index) =>
            {
                // Vereificar que la alternativa no este vacio
                if (alternativa.length > 0)
                {
                    let primerSimbolo = alternativa[0];
                    if (primerSimbolo.tipo === "NO_TERMINAL" && primerSimbolo.id === cabeza)
                    {
                        this.errores.push(`Error LL(1): Recursividad por la izquierda directa detectada en la producción ${cabeza} -> ${cabeza} ...`);
                        hayRecursividad = true;
                    }
                }
            });
        }
        return hayRecursividad;
    }

    verificarFactorizacion()
    {
        let faltaFactorizar = false;
        // Recorrer las producciones
        for (let [cabeza, alternativas] of this.producciones)
        {
            if (alternativas.length > 1)
            {
                let primerosSimbolos = new Set();
                alternativas.forEach((alternativa, index) =>
                {
                    if (alternativa.length > 0)
                    {
                        let primerSimbolo = alternativa[0];
                        // Creaa una clave unica para comparar
                        let claveSimbolo = primerSimbolo.tipo + "_" + primerSimbolo.id;
                        if (primerosSimbolos.has(claveSimbolo))
                        {
                            this.errores.push(`Error LL(1): Falta factorizar en la producción ${cabeza}. Se detecto ambigüedad al iniciar con '${primerSimbolo.id}' en múltiples alternativas.`);
                            faltaFactorizar = true;
                        }
                        else
                        {
                            primerosSimbolos.add(claveSimbolo);
                        }
                    }
                });
            }
        }
        return faltaFactorizar;
    }
}
module.exports = GestorGramatica;