import { messageList } from "../data/chatData.js";

export const getProperMessage = (userMessage) => {
  let bestScore = 0;
  let bestTopic = null;
  for (const item of messageList) {
    let score = 0;
    for (const keyword of item.keywords) {
      if (userMessage?.includes(keyword)) {
        score += 10;
      }
      const keywordWords = keyword.split(" ");
    }
    if (score > bestScore) {
      bestScore = score;
      bestTopic = item;
    }
    // if (bestScore > 7) {
    //   return bestTopic;
    // }
  }
  return bestTopic;
};
