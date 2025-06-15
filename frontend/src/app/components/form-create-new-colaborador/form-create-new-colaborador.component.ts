import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ColaboradoresService, Colaborador } from '../../services/colaboradores.service';
import { Router } from '@angular/router';
import { response } from 'express';

@Component({
  selector: 'app-form-create-new-colaborador',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './form-create-new-colaborador.component.html',
  styleUrl: './form-create-new-colaborador.component.css'
})
export class FormCreateNewColaboradorComponent implements OnInit {
  colaboradorForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private colaboradoresService: ColaboradoresService,
    private router: Router
  ) {
    this.colaboradorForm = this.fb.group({
      nombre_completo: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      fecha_ingreso: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    
  }

  onSubmit(): void {
    if (this.colaboradorForm.valid) {
      const nuevoColaborador: Colaborador = {

        nombre_completo: this.colaboradorForm.get('nombre_completo')?.value,
        correo: this.colaboradorForm.get('correo')?.value,
        fecha_ingreso: this.colaboradorForm.get('fecha_ingreso')?.value,
        estado_bienvenida: 'Pendiente', 
        tipo_onboarding_tecnico: null,
        estado_tecnico: 'Pendiente',    
        fecha_onboarding: null,          

      };

      this.colaboradoresService.createColaborador(nuevoColaborador).subscribe({
        next: (response) => {
          console.log('Colaborador creado exitosamente:', response);
          alert('Colaborador creado exitosamente');
          this.router.navigate(['/colaboradores']);
        },
        error: (error) => {
          console.error('Error al crear el colaborador:', error);
          if (error.status === 409) {
            alert(error.error.message || 'El correo ya está registrado');
          } else {
            alert('Error:' + (error.error?.message || error.message));
          }
        }
      });
    } else {
      alert('Campos incompletos o inválidos');
      this.colaboradorForm.markAllAsTouched();
    }
  }
}

