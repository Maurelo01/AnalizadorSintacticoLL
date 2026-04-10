import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private apiUrl = 'http://localhost:3000/api/compilar';
  constructor(private http: HttpClient) { }

  enviarParaCompilar(gramatica: string, textoAEvaluar: string): Observable<any>
  {
    const datosCompilacion = { gramatica: gramatica, textoAEvaluar: textoAEvaluar};
    return this.http.post(this.apiUrl, datosCompilacion);
  }
}
