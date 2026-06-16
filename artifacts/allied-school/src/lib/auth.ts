export function getAuthRole(): 'admin' | 'director' | 'teacher' | null {
  return localStorage.getItem('school_role') as 'admin' | 'director' | 'teacher' | null;
}

export function setAuthRole(role: 'admin' | 'director' | 'teacher') {
  localStorage.setItem('school_role', role);
}

export function getAuthUsername(): string | null {
  return localStorage.getItem('school_username');
}

export function setAuthUsername(username: string) {
  localStorage.setItem('school_username', username);
}

export function clearAuth() {
  localStorage.removeItem('school_role');
  localStorage.removeItem('school_username');
}

export function isAdmin(): boolean {
  return getAuthRole() === 'admin';
}

export const CLASSES_LIST = [
  'Playgroup',
  'Nursery',
  'Prep',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
];

export const SENIOR_CLASSES = ['Class 9', 'Class 10'];
export const SUBJECT_GROUPS = ['Bio Group', 'Computer Group'];
