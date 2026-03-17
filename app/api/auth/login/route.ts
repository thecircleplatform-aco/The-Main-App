import { handleLogin } from "@/auth/controllers/loginController";

export async function POST(request: Request) {
  return handleLogin(request);
}
