import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { FirebaseError } from "firebase/app";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView className="bg-background flex-1 justify-center p-5" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Card className="mx-auto w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-3xl">RTHA Login</CardTitle>
          <CardDescription>
          {isSignup ? "Create your account to continue." : "Sign in to access your health dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
          {isSignup ? <Input value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm Password" secureTextEntry /> : null}

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

          <Button onPress={onSubmit} disabled={isSubmitting}>
            <Text>{isSubmitting ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}</Text>
          </Button>

          <Button variant="ghost" onPress={() => setIsSignup((prev) => !prev)} disabled={isSubmitting}>
            <Text>{isSignup ? "Already have an account? Sign in" : "No account yet? Create one"}</Text>
          </Button>
          {!isSignup ? (
            <Button variant="link" onPress={() => router.push("/(auth)/forgot-password")} disabled={isSubmitting}>
              <Text>Forgot password?</Text>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </KeyboardAvoidingView>
  );
}
