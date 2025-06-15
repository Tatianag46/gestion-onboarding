import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColaboradoresService, Colaborador } from '../../services/colaboradores.service';
import { Router, RouterLink } from '@angular/router';
import { response } from 'express';

@Component({
  selector: 'app-colaboradores-list',
  imports: [
    CommonModule,
  ],
  templateUrl: './colaboradores-list.component.html',
  styleUrl: './colaboradores-list.component.css'
})
export class ColaboradoresListComponent implements OnInit {
  colaboradores: Colaborador[] = [];
  loading = true;

  constructor(
    private colaboradoresService: ColaboradoresService, 
    private router: Router) {}

  ngOnInit(): void {
    this.loadColaboradores();
  }

  loadColaboradores(): void {
    this.colaboradoresService.getColaboradores().subscribe({
      next: (data) => {
        this.colaboradores = data.map(colaborador => ({
            ...colaborador,
            fecha_ingreso: colaborador.fecha_ingreso ? new Date(colaborador.fecha_ingreso).toLocaleDateString() : '',
            fecha_onboarding: colaborador.fecha_onboarding ? new Date(colaborador.fecha_onboarding).toLocaleDateString() : ''
        }));
        console.log('Colaboradores cargados:', this.colaboradores);
      },
      error: (error) => {
        console.error('Error fetching Colaboradores:', error);
        alert('Error al cargar la lista de Colaboradores: ' + error.message);
        this.loading = false;
      }
    });
  }

  editColaborador(correo: string): void { 
    this.router.navigate(['/colaboradores/editar', correo]);
  }

  deleteColaborador(correo: string): void{
    if(confirm('¿Estás seguro de eliminar este Colaborador?')){
      this.colaboradoresService.deleteColaborador(correo).subscribe({
        next: (response) => {
          console.log('Colaborador eliminado:', response);
          this.loadColaboradores();
        },
        error: (error) => {
          console.error('Error al eliminar Colaborador:', error);
          alert('Error al eliminar Colaborador: ' + (error.error?.message || error.message));
        }
      });
    }
  }
}
