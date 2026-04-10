import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from './api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  gramatica: string = '';
  textoAEvaluar: string = '';
  resultados: any;
  cargando: boolean = false;
  columnasTAS: string[] = [];

  constructor(private api: Api) {}
  
  compilar()
  {
    if (!this.gramatica || !this.textoAEvaluar) 
    {
      alert('Por favor ingresa la gramática y el texto a evaluar.');
      return;  
    }
    this.cargando = true;
    this.resultados = null;
    this.columnasTAS = [];
    this.api.enviarParaCompilar(this.gramatica, this.textoAEvaluar).subscribe(
    {next: (respuesta) =>
      {
        {
          this.resultados = respuesta;
          this.cargando = false;
        }
      },
      error: (error) =>
      {
        console.error('Error con el servidor:', error);
        alert('Error al conectar con el servidor.');
        this.cargando = false;
      }
    });
  }

  obtenerTerminales()
  {
    let terminales = new Set<string>();
    for (let nt in this.resultados.tablaTAS)
    {
      for (let term in this.resultados.tablaTAS[nt])
      {
        terminales.add(term);
      }
    }
    this.columnasTAS = Array.from(terminales).sort();
  }
}
