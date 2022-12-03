export const SERVER_URL = process.env.NODE_ENV === "production" ?
        "https://api.quizici.st" :
        "http://localhost:5000";

export const API_URL = `/api`;
export const AUTH_URL = `/auth`;

export const ALL_GENERATIONS_URL = `${API_URL}/generated/all`;
