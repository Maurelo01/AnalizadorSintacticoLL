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
        this.firsts = new Map();
        this.follows = new Map();
        this.generarTablaSimbolos();
        this.verificarRecursividadIzquierda();
        this.verificarFactorizacion();
    }

    calcularFirsts()
    {
        for (let nt of this.noTerminales)
        {
            this.firsts.set(nt, new Set());
        }
        let huboCambios = true;
        while (huboCambios)
        {
            huboCambios = false;
            for (let [cabeza, alternativas] of this.producciones)
            {
                let firstDeCabeza = this.firsts.get(cabeza);
                let tamanoOriginal = firstDeCabeza.size;
                alternativas.forEach(alternativa =>
                {
                    if (alternativa.length === 0) // Epsilon agrega ε a first
                    {
                        firstDeCabeza.add('ε');
                    }
                    else
                    {
                        let primerSimbolo = alternativa[0];
                        // Si empieza con Terminal se agrega a first
                        if (primerSimbolo.tipo === "TERMINAL")
                        {
                            firstDeCabeza.add(primerSimbolo.id);
                        }
                        // Si empieza con No Terminal se hereda sus first
                        else if (primerSimbolo.tipo === "NO_TERMINAL")
                        {
                            let firstDelHijo = this.firsts.get(primerSimbolo.id);
                            if (firstDelHijo)
                            {
                                firstDelHijo.forEach(simbolo => firstDeCabeza.add(simbolo));
                            }
                        }
                    }
                });
                if (firstDeCabeza.size > tamanoOriginal)
                {
                    huboCambios = true;
                }
            }
        }
    }

    calcularFollows()
    {
        for (let nt of this.noTerminales)
        {
            this.follows.set(nt, new Set());
        }
        // Al símbolo inicial se le agrega el símbolo de fin de cadena $
        if (this.simboloInicial && this.follows.has(this.simboloInicial))
        {
            this.follows.get(this.simboloInicial).add('$');
        }
        let huboCambios = true;
        while (huboCambios)
        {
            huboCambios = false;
            for (let [cabeza, alternativas] of this.producciones)
            {
                alternativas.forEach(alternativa =>
                {
                    for (let i = 0; i < alternativa.length; i++)
                    {
                        let simboloActual = alternativa[i];
                        if (simboloActual.tipo === "NO_TERMINAL")
                        {
                            let followDelActual = this.follows.get(simboloActual.id);
                            let tamanoOriginal = followDelActual.size;
                            let tieneEpsilon = true;
                            for (let j = i + 1; j < alternativa.length; j++)
                            {
                                let simboloSiguiente = alternativa[j];
                                if (simboloSiguiente.tipo === "TERMINAL")
                                {
                                    followDelActual.add(simboloSiguiente.id);
                                    tieneEpsilon = false;
                                    break;
                                }
                                else if (simboloSiguiente.tipo === "NO_TERMINAL")
                                {
                                    let firstDelSiguiente = this.firsts.get(simboloSiguiente.id);
                                    if (firstDelSiguiente)
                                    {
                                        firstDelSiguiente.forEach(s => {
                                            if (s !== 'ε') followDelActual.add(s);
                                        });
                                        if (!firstDelSiguiente.has('ε'))
                                        {
                                            tieneEpsilon = false;
                                            break; 
                                        }
                                    }
                                }
                            }
                            // Si no hay nada adelante, o si todo lo de adelante tiene ε, entonces se hereda el Follow de la cabeza de la produccion
                            if (tieneEpsilon)
                            {
                                let followDeCabeza = this.follows.get(cabeza);
                                if (followDeCabeza)
                                {
                                    followDeCabeza.forEach(s => followDelActual.add(s));
                                }
                            }
                            if (followDelActual.size > tamanoOriginal)
                            {
                                huboCambios = true;
                            }
                        }
                    }
                });
            }
        }
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

    generarTablaParser()
    {
        this.tablaTAS = new Map();
        for (let nt of this.noTerminales)
        {
            this.tablaTAS.set(nt, new Map());
        }
        for (let [cabeza, alternativas] of this.producciones)
        {
            let fila = this.tablaTAS.get(cabeza);
            alternativas.forEach(alternativa =>
            {
                let firstDeAlternativa = this.obtenerFirstDeSecuencia(alternativa);
                // Para cada terminal en PRIMERO(α), agregamos la producción a M[A, a]
                firstDeAlternativa.forEach(terminal =>
                {
                    if (terminal !== 'ε')
                    {
                        if (fila.has(terminal))
                        {
                            this.errores.push(`Error TAS: Colisión en M[${cabeza}, ${terminal}]. La gramática no es LL(1) pura.`);
                        }
                        else
                        {
                            fila.set(terminal, alternativa);
                        }
                    }
                });
                // Si ε está en el PRIMERO(α) o la alternativa es vacía
                if (firstDeAlternativa.has('ε') || alternativa.length === 0)
                {
                    let followsDeCabeza = this.follows.get(cabeza);
                    if (followsDeCabeza)
                    {
                        followsDeCabeza.forEach(terminalSiguiente =>
                        {
                            let tokenColumna = terminalSiguiente === '$' ? '$_FIN' : terminalSiguiente;
                            if (fila.has(tokenColumna))
                            {
                                this.errores.push(`Error TAS: Colisión en M[${cabeza}, ${tokenColumna}] por regla de Epsilon.`);
                            }
                            else
                            {
                                fila.set(tokenColumna, alternativa);
                            }
                        });
                    }
                }
            });
        }
    }

    obtenerFirstDeSecuencia(secuencia)
    {
        let conjuntoFirst = new Set();
        if (secuencia.length === 0)
        {
            conjuntoFirst.add('ε');
            return conjuntoFirst;
        }
        let primerSimbolo = secuencia[0];
        if (primerSimbolo.tipo === "TERMINAL")
        {
            conjuntoFirst.add(primerSimbolo.id);
        }
        else if (primerSimbolo.tipo === "NO_TERMINAL")
        {
            let firstDelNt = this.firsts.get(primerSimbolo.id);
            if (firstDelNt)
            {
                firstDelNt.forEach(s => conjuntoFirst.add(s));
            }
        }
        return conjuntoFirst;
    }

    analizarCadenaConPila(tokensLexer)
    {
        console.log("\n--- INICIANDO ANÁLISIS LL(1) CON PILA ---");
        let pila = [];
        pila.push({ tipo: "TERMINAL", id: "$_FIN" });
        pila.push({ tipo: "NO_TERMINAL", id: this.simboloInicial });
        let ptr = 0;
        let tokenActual = tokensLexer[ptr];
        while (pila.length > 0)
        {
            let X = pila.pop();
            let a = tokenActual;
            console.log(`Pila tope: ${X.id} | Token entrada: ${a.id}`);
            if (X.tipo === "TERMINAL")
            {
                if (X.id === a.id)
                {
                    ptr++;
                    if (ptr < tokensLexer.length) tokenActual = tokensLexer[ptr];
                }
                else
                {
                    console.error(`Error Sintáctico: Se esperaba '${X.id}', se encontró '${a.id}' en lexema '${a.lexema}'`);
                    return false;
                }
            } 
            else if (X.tipo === "NO_TERMINAL")
            {
                let fila = this.tablaTAS.get(X.id);
                // Busca M[X, a]
                if (fila && fila.has(a.id))
                {
                    let alternativa = fila.get(a.id);
                    // Si no es ε se mete en los símbolos a la pila de forma inversa
                    if (alternativa.length > 0)
                    {
                        for (let i = alternativa.length - 1; i >= 0; i--)
                        {
                            pila.push(alternativa[i]);
                        }
                    }
                }
                else
                {
                    console.error(`Error Sintáctico: No hay regla en TAS para M[${X.id}, ${a.id}]. Token inesperado: '${a.lexema}'`);
                    return false;
                }
            }
        }
        if (tokenActual.id !== "$_FIN")
        {
            console.error("Error Sintáctico: Entrada no consumida completamente.");
            return false;
        }
        console.log("¡Cadena aceptada con éxito! La pila está vacía y se consumió la entrada.");
        return true;
    }

    mostrarTAS()
    {
        console.log("\n--- TABLA DE PARSER (TAS) ---");
        for (let [nt, fila] of this.tablaTAS)
        {
            let conexiones = [];
            for (let [terminal, alternativa] of fila)
            {
                let produccionStr = alternativa.length === 0 ? "ε" : alternativa.map(s => s.id).join(" ");
                conexiones.push(`[${terminal}] -> ${produccionStr}`);
            }
            console.log(` M[${nt}]: ${conexiones.join(" | ")}`);
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

    mostrarErrores()
    {
        if (this.errores.length > 0)
        {
            console.log("\n--- ERRORES ---");
            this.errores.forEach(e => console.error(" ", e));
        }
        else
        {
            console.log("\nLa gramática es apta para LL, sin recursividad por la izquierda.");
        }
    }

    mostrarFirsts()
    {
        console.log("\n--- CONJUNTOS FIRST ---");
        for (let [nt, conjunto] of this.firsts)
        {
            console.log(` FIRST(${nt}) = { ${Array.from(conjunto).join(', ')} }`);
        }
    }

    mostrarFollows()
    {
        console.log("\n--- CONJUNTOS FOLLOW ---");
        for (let [nt, conjunto] of this.follows)
        {
            console.log(` FOLLOW(${nt}) = { ${Array.from(conjunto).join(', ')} }`);
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
                        this.errores.push(`Error LL: Recursividad por la izquierda directa detectada en la producción ${cabeza} -> ${cabeza} ...`);
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
                            this.errores.push(`Error LL: Falta factorizar en la producción ${cabeza}. Se detecto ambigüedad al iniciar con '${primerSimbolo.id}' en múltiples alternativas.`);
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