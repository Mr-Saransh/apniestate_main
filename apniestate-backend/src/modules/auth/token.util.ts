import bcrypt from "bcryptjs";

export const hashToken = (token: string) => bcrypt.hash(token, 10);
export const compareToken = (token: string, hash: string) => bcrypt.compare(token, hash);
