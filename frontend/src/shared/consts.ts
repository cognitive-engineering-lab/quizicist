export const SERVER_URL = process.env.NODE_ENV === "production" ?
        "https://api.quizici.st/api" :
        "http://localhost:5000/api";

export const ALL_GENERATIONS_URL = `${SERVER_URL}/generated/all`;
