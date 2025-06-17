import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { ColaboradoresService, Colaborador } from '../../services/colaboradores.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-form-edit-colaborador',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './form-edit-colaborador.component.html',
  styleUrl: './form-edit-colaborador.component.css'
})

export class FormEditColaboradorComponent implements OnInit {
  colaboradorForm: FormGroup;
  colaboradorCorreo: string | null = null;
  colaboradorOriginal: Colaborador | null = null;

  estadoOpciones: string[] = ['Pendiente', 'Completado', 'No Completado'];
  tipoOnboardingTecnicoOpciones: string[] = ['Journey to Cloud', 'Otros'];
  fechaMinima: string = '';

  constructor(
    private fb: FormBuilder,
    private colaboradoresService: ColaboradoresService,
    private route: ActivatedRoute,
    private router: Router
  ) {

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.fechaMinima = hoy.toISOString().split('T')[0];

    this.colaboradorForm = this.fb.group({
      nombre_completo: [{ value: '', disabled: true }],
      correo: [{ value: '', disabled: true }],
      fecha_ingreso: [{ value: '', disabled: true }],
      estado_bienvenida: ['', Validators.required],
      tipo_onboarding_tecnico: [null, Validators.required],
      estado_tecnico: ['', Validators.required],
      fecha_onboarding: [{ value: null, disabled: true }]
    });

    this.colaboradorForm.get('tipo_onboarding_tecnico')?.valueChanges.subscribe(tipo => {
      const fechaControl = this.colaboradorForm.get('fecha_onboarding');
      if (tipo) {
        fechaControl?.enable(); 
        fechaControl?.setValidators(this.fechaOnboardingValidator());
        fechaControl?.markAsUntouched(); 
        fechaControl?.markAsPristine(); 
        fechaControl?.setErrors(null); 
      } else {
        fechaControl?.disable(); 
        fechaControl?.setValue(null); 
        fechaControl?.clearValidators(); 
        fechaControl?.setErrors(null); 
        fechaControl?.markAsUntouched();
        fechaControl?.markAsPristine(); 
      }
      fechaControl?.updateValueAndValidity(); 
    });
  }

  ngOnInit(): void {
    this.colaboradorCorreo = this.route.snapshot.paramMap.get('correo');
    if (this.colaboradorCorreo) {
      this.loadColaborador(this.colaboradorCorreo);
    } else {
      alert('Correo del colaborador no proporcionado para edición.');
      this.router.navigate(['/colaboradores']);
    }
  }

  loadColaborador(correo: string): void {
    this.colaboradoresService.getColaboradorByCorreo(correo).subscribe({
      next: (colab) => {
        this.colaboradorOriginal = colab;
        const fechaIngresoFormatted = colab.fecha_ingreso ? new Date(colab.fecha_ingreso).toISOString().substring(0, 10) : '';
        const fechaOnboardingFormatted = colab.fecha_onboarding ? new Date(colab.fecha_onboarding).toISOString().substring(0, 10) : null;

        this.colaboradorForm.patchValue({
          nombre_completo: colab.nombre_completo,
          correo: colab.correo,
          fecha_ingreso: fechaIngresoFormatted,
          estado_bienvenida: colab.estado_bienvenida,
          tipo_onboarding_tecnico: colab.tipo_onboarding_tecnico || null,
          estado_tecnico: colab.estado_tecnico,
          fecha_onboarding: fechaOnboardingFormatted
        });

        const tipoOnboarding = this.colaboradorForm.get('tipo_onboarding_tecnico')?.value;
        const fechaOnboardingControl = this.colaboradorForm.get('fecha_onboarding');

        if (tipoOnboarding) {
          fechaOnboardingControl?.enable();
          fechaOnboardingControl?.setValidators(this.fechaOnboardingValidator());
        } else {
          fechaOnboardingControl?.disable();
          fechaOnboardingControl?.clearValidators();
          fechaOnboardingControl?.setValue(null);
        }
        fechaOnboardingControl?.updateValueAndValidity();
      },
      error: (error) => {
        console.error('Error al cargar datos del colaborador:', error);
        alert('Error al cargar datos del colaborador para edición: ' + (error.error?.message || error.message));
        this.router.navigate(['/colaboradores']);
      }
    });
  }

  // Validador personalizado para la fecha de onboarding
  fechaOnboardingValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const fechaOnboarding = control.value;
      const tipoOnboarding = this.colaboradorForm?.get('tipo_onboarding_tecnico')?.value;

      if (control.disabled || !fechaOnboarding || !tipoOnboarding) {
        return null;
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const [year, month, dayStr] = fechaOnboarding.split('-');
      const fechaSeleccionada = new Date(Number(year), Number(month) - 1, Number(dayStr)); 

      if (fechaSeleccionada.getTime() < hoy.getTime()) {
        return { 'fechaPasada': true };
      }

      const diaSemana = fechaSeleccionada.getDay(); 
      if (diaSemana === 6 || diaSemana === 7) { 
        return { 'finDeSemanaInvalido': true };
      }

      const date = fechaSeleccionada.getDate(); 
      if (tipoOnboarding === 'Journey to Cloud') {
        // Para Journey to Cloud debe ser dia par
        if (date % 2 !== 0) {
          return { 'diaImparParaJourney': true };
        }
      } else if (tipoOnboarding === 'Otros') {
        // Para otros debe ser impar
        if (date % 2 === 0) {
          return { 'diaParParaOtros': true };
        }
      }
      return null; 
    };
  }


  onSubmit(): void {
    const tipoOnboarding = this.colaboradorForm.get('tipo_onboarding_tecnico')?.value;
    const fechaOnboarding = this.colaboradorForm.get('fecha_onboarding')?.value;
    const fechaControl = this.colaboradorForm.get('fecha_onboarding');

    if (tipoOnboarding && !fechaOnboarding) {
      fechaControl?.setErrors({ required: true });
      fechaControl?.markAsTouched();
    } else if (!tipoOnboarding && fechaOnboarding) {
      fechaControl?.setValue(null);
      fechaControl?.disable();
      fechaControl?.clearValidators();
      fechaControl?.setErrors(null);
    } else if (!tipoOnboarding && !fechaOnboarding) {
      fechaControl?.setValue(null);
      fechaControl?.disable();
      fechaControl?.clearValidators();
      fechaControl?.setErrors(null);
    } else if (tipoOnboarding && fechaOnboarding) {
      if (fechaControl?.hasError('required')) {
        fechaControl.setErrors(null);
      }
    }

    this.colaboradorForm.markAllAsTouched();
    this.colaboradorForm.updateValueAndValidity();


    if (this.colaboradorForm.valid) {
      const updates: Partial<Colaborador> = {
        estado_bienvenida: this.colaboradorForm.get('estado_bienvenida')?.value,
        estado_tecnico: this.colaboradorForm.get('estado_tecnico')?.value,
        tipo_onboarding_tecnico: tipoOnboarding,
        fecha_onboarding: fechaOnboarding
      };

      this.colaboradoresService.updateColaborador(this.colaboradorCorreo!, updates).subscribe({
        next: (response) => {
          console.log('Colaborador actualizado:', response);
          alert('Colaborador actualizado exitosamente!');
          this.router.navigate(['/colaboradores']);
        },
        error: (error) => {
          console.error('Error al actualizar colaborador:', error);
          alert('Hubo un error al actualizar el colaborador: ' + (error.error?.message || error.message));
        }
      });
    } else {
      alert('Por favor, completa todos los campos obligatorios y corrige los errores de validación.');
      console.log('Errores del formulario:', this.colaboradorForm.errors);
      console.log('Errores en fecha_onboarding:', this.colaboradorForm.get('fecha_onboarding')?.errors);
      console.log('Errores en tipo_onboarding_tecnico:', this.colaboradorForm.get('tipo_onboarding_tecnico')?.errors);
    }
  }
}