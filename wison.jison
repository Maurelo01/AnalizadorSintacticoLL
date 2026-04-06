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

/* ----- ANALIZADOR SINTÁCTICO ----- */

%start inicio

%%

inicio
    : RW_WISON_INICIO bloque_lexico bloque_syntax RW_WISON_FIN EOF
        {
            return
            {
                tipo: "GRAMATICA_WISON",
                lexico: $2,
                sintactico: $3
            };
        }
    ;

/* ----- BLOQUE LÉXICO ----- */

bloque_lexico
    : RW_LEX_INICIO lista_terminales RW_LEX_FIN
        { $$ = $2; }
    ;

lista_terminales
    : lista_terminales instruccion_terminal     { $$ = $1; $$.push($2); }
    | instruccion_terminal                      { $$ = [$1]; }
    ;

instruccion_terminal
    : RW_TERMINAL ID_TERMINAL FLECHA_LEX expresion_lexica PUNTOCOMA
        {
            $$ = { id: $2, expresion: $4 };
        }
    ;

/* ----- Expresiones regulares del bloque Léxico ----- */

expresion_lexica
    : expresion_lexica OPE_KLEENE            { $$ = { tipo: "KLEENE",   expr: $1 }; }
    | expresion_lexica OPE_POSITIVA          { $$ = { tipo: "POSITIVA", expr: $1 }; }
    | expresion_lexica OPE_OPCIONAL          { $$ = { tipo: "OPCIONAL", expr: $1 }; }
    | PAR_ABRIR lista_concat PAR_CERRAR     { $$ = { tipo: "CONCAT", exprs: $2 }; }
    | CADENA                                { $$ = { tipo: "CADENA",   valor: $1 }; }
    | CONJUNTO_LETRAS                       { $$ = { tipo: "LETRAS" }; }
    | CONJUNTO_NUMEROS                      { $$ = { tipo: "NUMEROS" }; }
    | ID_TERMINAL                           { $$ = { tipo: "REF_TERMINAL", id: $1 }; }
    ;

/* ----- concatenación dentro de paréntesis ----- */
lista_concat
    : lista_concat expresion_lexica { $$ = $1; $$.push($2); }
    | expresion_lexica              { $$ = [$1]; }
    ;

/* ----- BLOQUE SYNTAX ----- */

bloque_syntax
    : RW_SYNTAX_INICIO declaraciones_syntax RW_SYNTAX_FIN
        { $$ = $2; }
    ;

declaraciones_syntax
    : declaraciones_syntax declaracion_syntax { $$ = $1; $$.push($2); }
    | declaracion_syntax                      { $$ = [$1]; }
    ;

declaracion_syntax
    : decl_no_terminal  { $$ = $1; }
    | decl_initial_sim  { $$ = $1; }
    | produccion        { $$ = $1; }
    ;

/* ----- Declaracion no terminal ----- */

decl_no_terminal
    : RW_NO_TERMINAL ID_NOTERMINAL PUNTOCOMA
        {
            $$ = { tipo: "NO_TERMINAL", id: $2 };
        }
    ;

/* ----- Declaracion símbolo inicial ----- */

decl_initial_sim
    : RW_INITIAL_SIM ID_NOTERMINAL PUNTOCOMA
        {
            $$ = { tipo: "INITIAL_SIM", id: $2 };
        }
    ;

/* ----- Reglas de producción ----- */

produccion
    : ID_NOTERMINAL FLECHA_SYNTAX lista_alternativas PUNTOCOMA
        {
            $$ = { tipo: "PRODUCCION", cabeza: $1, alternativas: $3 };
        }
    ;

lista_alternativas
    : lista_alternativas OR cuerpo_produccion { $$ = $1; $$.push($3); }
    | cuerpo_produccion                       { $$ = [$1]; }
    ;

/* cuerpo: secuencia de terminales y no terminales */

cuerpo_produccion
    : cuerpo_produccion simbolo_produccion { $$ = $1; $$.push($2); }
    | simbolo_produccion                   { $$ = [$1]; }
    ;

simbolo_produccion
    : ID_TERMINAL   { $$ = { tipo: "TERMINAL",    id: $1 }; }
    | ID_NOTERMINAL { $$ = { tipo: "NO_TERMINAL", id: $1 }; }
    ;