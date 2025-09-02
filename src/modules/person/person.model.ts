export interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: "admin" | "user";
}
