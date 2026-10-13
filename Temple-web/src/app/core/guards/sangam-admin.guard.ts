import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

export const sangamAdminGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  const user = api.currentUser();

  // Explicitly allow only SANGAM_ADMIN role
  if (user && user.role === 'SANGAM_ADMIN') {
    return true;
  }

  // Deny access and redirect unauthorized users appropriately
  if (!user) {
    router.navigate(['/login']);
  } else if (user.role === 'SUPER_ADMIN') {
    router.navigate(['/super-admin']);
  } else {
    router.navigate(['/dashboard']);
  }

  return false;
};
