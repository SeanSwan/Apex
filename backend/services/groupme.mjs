import axios from 'axios';

const API_URL = 'https://api.groupme.com/v3';
const TOKEN = process.env.GROUPME_TOKEN;

const groupMeApi = axios.create({
  baseURL: API_URL,
  params: {
    token: TOKEN,
  },
});

export const fetchGroups = async () => {
  const response = await groupMeApi.get('/groups');
  return response.data.response;
};

export const createBot = async (groupId, botName, callbackUrl = '', avatarUrl = '') => {
  const response = await groupMeApi.post('/bots', {
    bot: {
      name: botName,
      group_id: groupId,
      callback_url: callbackUrl,
      avatar_url: avatarUrl,
    },
  });
  return response.data.response.bot;
};

export const sendNotification = async (botId, message) => {
  await groupMeApi.post('/bots/post', {
    bot_id: botId,
    text: message,
  });
};

export const checkInGuard = async (groupId, guardName, botId) => {
  const message = `${guardName} checked in.`;
  await sendNotification(botId, message);
};