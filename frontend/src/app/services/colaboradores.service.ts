import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Colaborador {
  nombre_completo: string;
  correo: string;
  fecha_ingreso: string;
  estado_bienvenida: string;
  tipo_onboarding_tecnico: string | null;
  estado_tecnico: string;
  fecha_onboarding: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ColaboradoresService {
  private apiUrl = 'http://localhost:3000/colaboradores';
  private mailApiUrl = 'http://localhost:3000/send-alert-email';

  constructor(private http: HttpClient) { }

  // Obtener todos los colaboradores
  getColaboradores(): Observable<Colaborador[]> {
    return this.http.get<Colaborador[]>(this.apiUrl);
  }

  //Crear un nuevo colaborador
  createColaborador(colaborador: Colaborador): Observable<any> {
    const payload = {
      Nombre_Completo: colaborador.nombre_completo,
      Correo: colaborador.correo,
      Fecha_Ingreso: colaborador.fecha_ingreso,
      Estado_Bienvenida: colaborador.estado_bienvenida,
      Tipo_Onboarding_Tecnico: colaborador.tipo_onboarding_tecnico,
      Estado_Tecnico: colaborador.estado_tecnico,
      Fecha_Onboarding: colaborador.fecha_onboarding
    };
    return this.http.post<any>(this.apiUrl, payload);
  }

  //Obtener un colaborador por correo
  getColaboradorByCorreo(correo: string): Observable<Colaborador> {
    return this.http.get<Colaborador>(`${this.apiUrl}/${correo}`);
  }

  //Actualizar un colaborador
  updateColaborador(correo: string, updates: Partial<Colaborador>): Observable<any> {
    const payload: any = {};
    if (updates.estado_bienvenida !== undefined) {
      payload.Estado_Bienvenida = updates.estado_bienvenida;
    }
    if (updates.tipo_onboarding_tecnico !== undefined) {
      payload.Tipo_Onboarding_Tecnico = updates.tipo_onboarding_tecnico;
    }
    if (updates.estado_tecnico !== undefined) {
      payload.Estado_Tecnico = updates.estado_tecnico;
    }
    if (updates.fecha_onboarding !== undefined) {
      payload.Fecha_Onboarding = updates.fecha_onboarding;
    }
    return this.http.put<any>(`${this.apiUrl}/${correo}`, payload);
  }

  //Eliminar un colaborador
  deleteColaborador(correo: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${correo}`);
  }

  sendOnboardingAlertEmail(to: string, subject: string, body: string): Observable<any>{
    const payload = {to, subject, body};
    return this.http.post<any>(this.mailApiUrl, payload);
  }
}