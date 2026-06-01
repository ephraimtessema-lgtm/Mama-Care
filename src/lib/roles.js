export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
};

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

export function isDoctor(user) {
  return user?.role === ROLES.DOCTOR;
}

export function isRegularUser(user) {
  return !user?.role || user.role === ROLES.USER;
}
