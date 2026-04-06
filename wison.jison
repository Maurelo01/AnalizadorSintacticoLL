/* ----- ANALIZADOR LÉXICO ----- */

%lex
%%

\s+                         /* ignorar espacios en blanco, tabulaciones y saltos */
"#"[^\r\n]*                 /* ignorar comentarios de linea */
"/**"[\s\S]*?"*/"           /* ignorar comentarios de bloque */

/* ----- Palabras reservadas de wison ----- */

"Wison¿"                    return 'RW_WISON_INICIO';
"?Wison"                    return 'RW_WISON_FIN';
"Lex"\s*"{:"                return 'RW_LEX_INICIO';
":}"                        return 'RW_LEX_FIN';
"Syntax"\s*"{{:"            return 'RW_SYNTAX_INICIO';
":}}"                       return 'RW_SYNTAX_FIN';
"Terminal"                  return 'RW_TERMINAL';
"No_Terminal"               return 'RW_NO_TERMINAL';
"Initial_Sim"               return 'RW_INITIAL_SIM';

/* ----- Símbolos y operadores ----- */

"<-"                        return 'FLECHA_LEX';
"<="                        return 'FLECHA_SYNTAX';
";"                         return 'PUNTOCOMA';
"|"                         return 'OR';
"*"                         return 'OPE_KLEENE';
"+"                         return 'OPE_POSITIVA';
"?"                         return 'OPE_OPCIONAL';
"("                         return 'PAR_ABRIR';
")"                         return 'PAR_CERRAR';

/* ----- Identificadores especiales de wison ----- */

"$_"[a-zA-Z0-9_]+           return 'ID_TERMINAL';
"%_"[a-zA-Z0-9_]+           return 'ID_NOTERMINAL';

/* ----- Cadenas y expresiones ----- */

"'"[^']+"'"                 return 'CADENA';
"[aA-zZ]"                   return 'CONJUNTO_LETRAS';
"[0-9]"                     return 'CONJUNTO_NUMEROS';

<<EOF>>                      return 'EOF';

/* ----- Manejo de errores léxicos ----- */

.   { throw new Error('Error léxico: carácter inesperado "' + yytext + '" en línea ' + yylloc.first_line); }

/lex