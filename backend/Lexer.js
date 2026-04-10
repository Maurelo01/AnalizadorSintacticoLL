class Lexer
{
    constructor(terminales)
    {
        this.terminales = terminales;
    }

    generarTokens(entrada)
    {
        let tokens = [];
        let pos = 0;
        while (pos < entrada.length)
        {
            let caracterActual = entrada[pos];
            if ([' ', '\n', '\r', '\t'].includes(caracterActual))
            {
                pos++;
                continue;
            }
            let igualEncontrado = false;
            let mejorIgual = { id: null, lexema: "", longitud: 0 };
            for (let [id, expr] of this.terminales)
            {
                let longitud = this.verificarAST(expr, entrada, pos);
                if (longitud > 0)
                {
                    if (longitud > mejorIgual.longitud)
                    {
                        mejorIgual = { id: id, lexema: entrada.substring(pos, pos + longitud), longitud: longitud };
                        igualEncontrado = true;
                    }
                }
            }
            if (igualEncontrado)
            {
                tokens.push({ id: mejorIgual.id, lexema: mejorIgual.lexema });
                pos += mejorIgual.longitud;
            }
            else
            {
                throw new Error(`Error léxico: Carácter no reconocido '${caracterActual}' en la posición ${pos}`);
            }
        }
        tokens.push({ id: "$_FIN", lexema: "EOF" }); 
        return tokens;
    }

    verificarAST(nodo, cadena, pos)
    {
        if (pos >= cadena.length) return -1;
        switch (nodo.tipo)
        {
            case "CADENA":
                let valor = nodo.valor.replace(/'/g, "");
                if (cadena.substring(pos, pos + valor.length) === valor)
                {
                    return valor.length; 
                }
                return -1; 
            case "LETRAS":
                let charLetra = cadena[pos];
                if ((charLetra >= 'a' && charLetra <= 'z') || (charLetra >= 'A' && charLetra <= 'Z'))
                {
                    return 1;
                }
                return -1;
            case "NUMEROS":
                let charNum = cadena[pos];
                if (charNum >= '0' && charNum <= '9')
                {
                    return 1;
                }
                return -1;
            case "CONCAT":
                let avanceConcat = 0;
                for (let expr of nodo.exprs)
                {
                    let res = this.verificarAST(expr, cadena, pos + avanceConcat);
                    if (res === -1) return -1; 
                    avanceConcat += res;
                }
                return avanceConcat;
            case "POSITIVA":
                let avancePositiva = this.verificarAST(nodo.expr, cadena, pos);
                if (avancePositiva === -1) return -1; 
                while (pos + avancePositiva < cadena.length)
                {
                    let res = this.verificarAST(nodo.expr, cadena, pos + avancePositiva);
                    if (res === -1 || res === 0) break;
                    avancePositiva += res;
                }
                return avancePositiva;
            case "KLEENE":
                let avanceKleene = 0;
                while (pos + avanceKleene < cadena.length)
                {
                    let res = this.verificarAST(nodo.expr, cadena, pos + avanceKleene);
                    if (res === -1 || res === 0) break;
                    avanceKleene += res;
                }
                return avanceKleene; 
            case "OPCIONAL":
                let resOpcional = this.verificarAST(nodo.expr, cadena, pos);
                return resOpcional === -1 ? 0 : resOpcional; 
            case "REF_TERMINAL":
                let exprReferenciada = this.terminales.get(nodo.id);
                if (exprReferenciada)
                {
                    return this.verificarAST(exprReferenciada, cadena, pos);
                }
                return -1;    
            default:
                return -1;
        }
    }
}
module.exports = Lexer;