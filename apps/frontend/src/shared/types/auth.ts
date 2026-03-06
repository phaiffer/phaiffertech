export type AuthenticatedUser = {
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  role: string;
  permissions: string[];
};

export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: AuthenticatedUser;
};

export type SessionState = {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
};
