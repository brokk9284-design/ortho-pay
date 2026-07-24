import { Redirect } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";

export default function AuthLayout() {
  const { user, initialized } = useAuthStore();

  if (initialized && user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
