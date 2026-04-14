import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { FirebaseError } from "firebase/app";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onReset = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSuccess("Password reset email sent. Check your inbox.");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Failed to send reset email.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView className="bg-background flex-1 justify-center p-5" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Card className="mx-auto w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-3xl">Reset Password</CardTitle>
          <CardDescription>Enter your account email and we will send reset instructions.</CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
          {success ? <Text className="text-success text-sm">{success}</Text> : null}

          <Button onPress={onReset} disabled={isSubmitting}>
            <Text>{isSubmitting ? "Please wait..." : "Send Reset Email"}</Text>
          </Button>

          <Button variant="ghost" onPress={() => router.replace("/(auth)/login")} disabled={isSubmitting}>
            <Text>Back to login</Text>
          </Button>
        </CardContent>
      </Card>
    </KeyboardAvoidingView>
  );
}
