const express = require('express');
const port = 3948;

const app = express();

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

const TelegramBot = require("node-telegram-bot-api");
const ytdl = require("ytdl-core");
const fs = require("fs");

require("dotenv").config();

const token = '7082296229:AAFXBeq_hjZk4-Fjnf2UjpLUwldKpsMs9ig';
const bot = new TelegramBot(token, { polling: true });

async function downloadVideo(chatId, url) {
  try {
    const videoInfo = await ytdl.getInfo(url);
    const title = videoInfo.videoDetails.title;
    const thumbnailUrl = videoInfo.videoDetails.thumbnails[videoInfo.videoDetails.thumbnails.length - 1].url;

    const message = await bot.sendMessage(chatId, `Downloading video: ${title}`);

    const writeStream = fs.createWriteStream(`${title}-${chatId}.mp4`);

    ytdl(url, { filter: "audioandvideo" }).pipe(writeStream);

    let progress = 0;
    const updateInterval = setInterval(() => {
      progress = writeStream.bytesWritten / (1024 * 1024);
      bot.editMessageText(`Downloading video: ${title} (${progress.toFixed(2)} MB)`, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: "Markdown",
      });
    }, 2000);

    writeStream.on("finish", () => {
      clearInterval(updateInterval);
      bot.sendVideo(chatId, `${title}-${chatId}.mp4`, {
        caption: `Video downloaded: ${title} by @TsuyuOfficial`,
        thumb: thumbnailUrl,
        duration: videoInfo.videoDetails.lengthSeconds,
        parse_mode: "Markdown",
      }).then(() => {
        fs.unlinkSync(`${title}-${chatId}.mp4`);
      }).catch((error) => {
        bot.sendMessage(chatId, "Error sending video.");
        console.error(error);
      });
    });
  } catch (error) {
    bot.sendMessage(chatId, "Error downloading video.");
    console.error(error);
  }
}

bot.onText(/\/yt/, (msg) => {
  const chatId = msg.chat.id;
  const url = msg.text.split(" ")[1];

  if (ytdl.validateURL(url)) {
    downloadVideo(chatId, url);
  } else {
    bot.sendMessage(chatId, "Invalid YouTube URL.");
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Hey, I am TsuyuDL made by @TsuyuOfficial. Use the following commands to use me!\n\n/yt - Give any YouTube link and TsuyuDL will download it for you.");
});
