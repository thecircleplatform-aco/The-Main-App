import { handleRegister } from "@/auth/controllers/registerController";

export async function POST(request: Request) {
  return handleRegister(request);
}
