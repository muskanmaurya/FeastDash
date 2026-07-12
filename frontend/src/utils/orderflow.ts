

export const ORDER_ACTIONS: Record<string, string[]> = {
    placed: ["accepted"],
    accepted: ["preparing"], // 🟢 FIXED THE TYPO HERE
    preparing: ["ready-for-rider"],
    "ready-for-rider": ["picked-up"], // Added next stages for completeness
    "picked-up": ["delivered"]
};