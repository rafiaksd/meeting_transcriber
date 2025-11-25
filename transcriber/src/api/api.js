const API_BASE = "http://192.168.0.100:5000";

export const api = {
  uploadAudio: async (file) => {
    const formData = new FormData();
    formData.append("audio", file);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },

  getStatus: async () => {
    const response = await fetch(`${API_BASE}/status`);
    return response.json();
  },

  getResult: async (taskId) => {
    const response = await fetch(`${API_BASE}/result/${taskId}`);
    return response.json();
  },

  getHistory: async () => {
    const response = await fetch(`${API_BASE}/history`);
    return response.json();
  },

  
};