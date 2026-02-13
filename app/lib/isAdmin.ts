import { fetchAuthSession } from "aws-amplify/auth";

export async function isAdminUser(): Promise<boolean> {
  try {
    const session = await fetchAuthSession();
    const groups = (session.tokens?.idToken?.payload?.["cognito:groups"] as string[]) ?? [];
    return Array.isArray(groups) && groups.includes("ADMIN");
  } catch {
    return false;
  }
}
