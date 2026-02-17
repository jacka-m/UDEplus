import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

// Called inside each handler so env vars are available at request time (required for Cloudflare Workers)
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

function hashPassword(password: string): string {
  return Buffer.from(password).toString("base64");
}

function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8);
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

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const verificationCode = generateVerificationCode();
    const userId = `user_${Date.now()}`;

    await supabase.from("pending_users").insert({
      id: userId,
      username,
      password: hashPassword(password),
      phone,
      verification_code: verificationCode,
    });

    // No real SMS service — find the code in Cloudflare Workers logs or via `npx wrangler tail`
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

    if (!user || user.password !== hashPassword(password)) {
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
