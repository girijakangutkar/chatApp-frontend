import { auth } from "../../firebaseConfig";
import { API_URL } from "../config";
export const updateProfile = async (profileData) => {
  try {
    const formData = new FormData();
    for (const key in profileData) {
      formData.append(key, profileData[key]);
    }

    const response = await fetch(`${API_URL}/update-profile`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Profile update failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};

//   return response;
// };
