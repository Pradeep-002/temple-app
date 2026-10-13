import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { LoginComponent } from './features/auth/login.component';
import { SangamAdminDashboardComponent } from './features/sangam-admin/dashboard.component';
import { SuperAdminDashboardComponent } from './features/super-admin/dashboard.component';
import { SuperAdminSangamsComponent } from './features/super-admin/sangams.component';
import { SuperAdminAdminsComponent } from './features/super-admin/admins.component';
import { CollectionMatrixComponent } from './features/collections/matrix.component';
import { MembersComponent } from './features/members/members.component';
import { EventsComponent } from './features/events/events.component';
import { DonationsComponent } from './features/donations/donations.component';
import { ExpensesComponent } from './features/expenses/expenses.component';
import { LedgerComponent } from './features/ledger/ledger.component';
import { SettingsComponent } from './features/settings/settings.component';
import { sangamAdminGuard } from './core/guards/sangam-admin.guard';
import { memberRestrictedGuard } from './core/guards/member-restricted.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: SangamAdminDashboardComponent },
  { path: 'super-admin', component: SuperAdminDashboardComponent, canActivate: [superAdminGuard] },
  { path: 'super-admin/sangams', component: SuperAdminSangamsComponent, canActivate: [superAdminGuard] },
  { path: 'super-admin/admins', component: SuperAdminAdminsComponent, canActivate: [superAdminGuard] },
  { path: 'collections', component: CollectionMatrixComponent },
  { path: 'members', component: MembersComponent, canActivate: [memberRestrictedGuard] },
  { path: 'events', component: EventsComponent },
  { path: 'donations', component: DonationsComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'ledger', component: LedgerComponent },
  { path: 'settings', component: SettingsComponent, canActivate: [sangamAdminGuard] },
  { path: '**', redirectTo: '' }
];
