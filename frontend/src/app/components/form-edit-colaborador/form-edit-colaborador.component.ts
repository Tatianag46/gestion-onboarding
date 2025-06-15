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
      tipo_onboarding_tecnico: [null],
      estado_tecnico: ['', Validators.required],
      fecha_onboarding: [null]
    });

    this.colaboradorForm.get('tipo_onboarding_tecnico')?.valueChanges.subscribe(tipo => {
      const fechaControl = this.colaboradorForm.get('fecha_onboarding');
      if (tipo) {
        fechaControl?.enable();
        fechaControl?.setValidators(this.fechaOnboardingValidator()); // Re-establece el validador al habilitar
      } else {
        fechaControl?.disable();
        fechaControl?.setValue(null);
        fechaControl?.clearValidators(); // Limpia validadores al deshabilitar
      }
      fechaControl?.updateValueAndValidity(); // Actualiza las validaciones
    });

    // Deshabilitar la fecha de onboarding inicialmente
    this.colaboradorForm.get('fecha_onboarding')?.disable();
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
      hoy.setHours(0, 0, 0, 0); // Limpiar la hora
      const [year, month, dayStr] = fechaOnboarding.split('-');
      const date = parseInt(dayStr, 10);
      const fechaSeleccionada = new Date(Number(year), Number(month) - 1, date);

      if (fechaSeleccionada < hoy) {
        return { 'fechaPasada': true };
      }

      // Validar fines de semana: sábado (6) y domingo (0)
      const diaSemana = fechaSeleccionada.getDay();
      if (diaSemana === 6 || diaSemana === 0) {
        return { 'finDeSemanaInvalido': true };
      }

      // Validar días pares/impares según tipo
      if (tipoOnboarding === 'Journey to Cloud' && date % 2 !== 0) {
        return { 'diaImparParaJourney': true };
      } else if (tipoOnboarding === 'Otros' && date % 2 === 0) {
        return { 'diaParParaOtros': true };
      }

      return null;
    };
  }


  onSubmit(): void {
    this.colaboradorForm.markAllAsTouched(); // Marcar todos los campos como tocados
    this.colaboradorForm.get('fecha_onboarding')?.updateValueAndValidity(); // Forzar la validación de la fecha

    if (this.colaboradorForm.valid) {
      const tipoOnboarding = this.colaboradorForm.get('tipo_onboarding_tecnico')?.value;
      const fechaOnboarding = this.colaboradorForm.get('fecha_onboarding')?.value;

      // Valida si la fecha es obligatoria si el tipo está seleccionado
      if (tipoOnboarding && !fechaOnboarding) {
        alert('Debe seleccionar una fecha para el tipo de onboarding técnico elegido.');
        this.colaboradorForm.get('fecha_onboarding')?.setErrors({ requiredDateForType: true });
        return; // Detener el envío
      }

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
    }
  }
}
