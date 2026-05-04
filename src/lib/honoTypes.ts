export type AuthUser = { id: string; email?: string };

export type AppEnv = {
  Variables: {
    user: AuthUser;
  };
};
