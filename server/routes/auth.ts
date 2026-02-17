import { RequestHandler } from "express";

// In-memory storage (in production, use a database)
interface StoredUser {
  id: string;
  username: string;
  password: string;
  phone: string;
  verificationCode?: string;
  createdAt: string;
}

interface PendingUser {
  id: string;
  username: string;
  password: string;
  phone: string;
  verificationCode: string;
  createdAt: string;
}

const users: StoredUser[] = [];
const pendingUsers: Map<string, PendingUser> = new Map();

// Simple hash function (for demo purposes - use bcrypt in production)
function hashPassword(password: string): string {
  return Buffer.from(password).toString("base64");
}

function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8);
}

// In production, this would send SMS via Twilio, AWS SNS, etc
function sendVerificationCode(phone: string, code: string): Promise<void> {
  console.log(
    `[SMS] Sending verification code ${code} to ${phone}`
  );
  // Simulate SMS delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
}

export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const { username, password, phone } = req.body;

    // Validation
    if (!username || !password || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Check if username already exists
    if (users.some((u) => u.username === username)) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const userId = `user_${Date.now()}`;

    // Store pending user
    const pendingUser: PendingUser = {
      id: userId,
      username,
      password: hashPassword(password),
      phone,
      verificationCode,
      createdAt: new Date().toISOString(),
    };

    pendingUsers.set(userId, pendingUser);

    // Send verification code
    await sendVerificationCode(phone, verificationCode);

    res.json({
      message: "Verification code sent",
      user: {
        id: userId,
        username,
        phone,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const handleVerifyPhone: RequestHandler = async (req, res) => {
  try {
    const { userId, code } = req.body;

    // Validation
    if (!userId || !code) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pendingUser = pendingUsers.get(userId);

    if (!pendingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (pendingUser.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Create verified user
    const newUser: StoredUser = {
      id: pendingUser.id,
      username: pendingUser.username,
      password: pendingUser.password,
      phone: pendingUser.phone,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    pendingUsers.delete(userId);

    res.json({
      message: "Phone verified successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        phone: newUser.phone,
        createdAt: newUser.createdAt,
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

    // Validation
    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const pendingUser = pendingUsers.get(userId);

    if (!pendingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new code
    const newCode = generateVerificationCode();
    pendingUser.verificationCode = newCode;

    // Send code
    await sendVerificationCode(phone, newCode);

    res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Resend code error:", error);
    res.status(500).json({ message: "Failed to resend code" });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = users.find((u) => u.username === username);

    if (!user || user.password !== hashPassword(password)) {
      return res
        .status(401)
        .json({ message: "Invalid username or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};
