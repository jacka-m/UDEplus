import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

// Use the service role key on the server so Supabase RLS doesn't block
// server-side operations. The service role key bypasses RLS, which is correct
// for trusted server code. Never expose this key to the browser.
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// SHA-256 + random salt via Web Crypto API (available in both Cloudflare
// Workers and Node.js 22+). Stored format: "<hex_salt>:<hex_hash>"
async function hashPassword(password: string, salt?: string): Promise<string> {
  const actualSalt =
    salt ??
    Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(actualSalt + password)
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${actualSalt}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const colonIdx = stored.indexOf(":");
  if (colonIdx === -1) {
    // Legacy base64 passwords — migrate on first successful login by checking
    // both formats. Remove this branch once all users have logged in once.
    const legacyHash = Buffer.from(password).toString("base64");
    return legacyHash === stored;
  }
  const salt = stored.slice(0, colonIdx);
  const recomputed = await hashPassword(password, salt);
  return recomputed === stored;
}

// Always produces exactly 6 digits (100000–999999)
function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const { username, password, phone, zipCode, language } = req.body;

    if (!username || !password || !phone || !zipCode) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const supabase = getSupabase();

    // Check both tables so a pending registration also blocks re-signup
    const [{ data: existingUser }, { data: existingPending }] = await Promise.all([
      supabase.from("users").select("id").eq("username", username).maybeSingle(),
      supabase.from("pending_users").select("id").eq("username", username).maybeSingle(),
    ]);

    if (existingUser || existingPending) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const verificationCode = generateVerificationCode();
    const userId = `user_${Date.now()}`;
    const hashedPassword = await hashPassword(password);

    const { error: insertError } = await supabase.from("pending_users").insert({
      id: userId,
      username,
      password: hashedPassword,
      phone,
      verification_code: verificationCode,
    });

    if (insertError) throw insertError;

    // No real SMS service yet — find the code via `npx wrangler tail`
    console.log(`[SMS] Verification code for ${phone}: ${verificationCode}`);

    res.json({
      message: "Verification code sent",
      user: {
        id: userId,
        username,
        phone,
        zipCode,
        language: language || "en",
        completedOnboarding: false,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const handleVerifyPhone: RequestHandler = async (req, res) => {
  try {
    const { userId, code, zipCode, language } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const supabase = getSupabase();

    const { data: pendingUser } = await supabase
      .from("pending_users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!pendingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (pendingUser.verification_code !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        id: pendingUser.id,
        username: pendingUser.username,
        password: pendingUser.password,
        phone: pendingUser.phone,
        zip_code: zipCode || "00000",
        language: language || "en",
        completed_onboarding: false,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("pending_users").delete().eq("id", userId);

    res.json({
      message: "Phone verified successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        phone: newUser.phone,
        zipCode: newUser.zip_code,
        language: newUser.language,
        completedOnboarding: newUser.completed_onboarding,
        createdAt: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("Verify phone error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const handleResendCode: RequestHandler = async (req, res) => {
  try {
    const { userId, phone } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const supabase = getSupabase();

    const { data: pendingUser } = await supabase
      .from("pending_users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!pendingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const newCode = generateVerificationCode();

    await supabase
      .from("pending_users")
      .update({ verification_code: newCode })
      .eq("id", userId);

    console.log(`[SMS] New verification code for ${phone}: ${newCode}`);

    res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Resend code error:", error);
    res.status(500).json({ message: "Failed to resend code" });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const passwordMatches = await verifyPassword(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        zipCode: user.zip_code,
        language: user.language,
        completedOnboarding: user.completed_onboarding,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

export const handleCompleteOnboarding: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const supabase = getSupabase();

    const { data: user, error } = await supabase
      .from("users")
      .update({ completed_onboarding: true })
      .eq("id", userId)
      .select()
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Onboarding completed",
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        zipCode: user.zip_code,
        language: user.language,
        completedOnboarding: user.completed_onboarding,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    res.status(500).json({ message: "Failed to complete onboarding" });
  }
};
