import { API_URL } from "../config";

export const login = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    });
    return await response.json();
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const verifyOTP = async (phoneNumber, otp) => {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, otp }),
    });
    return await response.json();
  } catch (error) {
    console.error("OTP verification error:", error);
    throw error;
  }
};
