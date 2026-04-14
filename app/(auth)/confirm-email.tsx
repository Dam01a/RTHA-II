import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

export default function ConfirmEmailScreen() {
  const { user, logout, sendVerificationEmail, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onResend = async () => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await sendVerificationEmail();
      setMessage("Verification email sent. Check your inbox.");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Could not send verification email.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onIHaveVerified = async () => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await refreshUser();
      setMessage("Account status refreshed.");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Could not refresh account status.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView className="bg-background flex-1 justify-center p-5" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Card className="mx-auto w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-3xl">Confirm Your Email</CardTitle>
          <CardDescription>We sent a verification email to:</CardDescription>
          <Text className="font-semibold">{user?.email ?? "your account email"}</Text>
          <CardDescription>Verify it, then tap \"I have verified\" to continue to the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
          {message ? <Text className="text-success text-sm">{message}</Text> : null}

          <Button onPress={onIHaveVerified} disabled={isSubmitting}>
            <Text>{isSubmitting ? "Please wait..." : "I have verified"}</Text>
          </Button>

          <Button variant="secondary" onPress={onResend} disabled={isSubmitting}>
            <Text>Resend verification email</Text>
          </Button>

          <Button variant="ghost" onPress={logout} disabled={isSubmitting}>
            <Text>Sign out</Text>
          </Button>
        </CardContent>
      </Card>
    </KeyboardAvoidingView>
  );
}
