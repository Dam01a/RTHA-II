import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getUserPhoneForReminders(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "users", uid));
  const ph = snap.data()?.phoneNumber;
  return typeof ph === "string" && ph.trim() ? ph.trim() : null;
}
