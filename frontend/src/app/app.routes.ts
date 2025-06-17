import { Routes } from '@angular/router';
import { ColaboradoresListComponent } from './components/colaboradores-list/colaboradores-list.component';
import { FormCreateNewColaboradorComponent } from './components/form-create-new-colaborador/form-create-new-colaborador.component';
import { FormEditColaboradorComponent } from './components/form-edit-colaborador/form-edit-colaborador.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { OnboardingCalendarComponent } from './components/calendario/calendario.component';

export const routes: Routes = [
    { path: '', redirectTo: 'colaboradores', pathMatch: 'full' },
    { path: 'colaboradores', component: ColaboradoresListComponent },
    { path: 'colaboradores/nuevo', component: FormCreateNewColaboradorComponent },
    { path: 'colaboradores/editar/:correo', component: FormEditColaboradorComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'calendario', component: OnboardingCalendarComponent },
    { path: '**', redirectTo: 'colaboradores' }
];
