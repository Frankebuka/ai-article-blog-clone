// import express from "express";
// import ytdl from "ytdl-core";
// import axios from "axios";
// import FormData from "form-data";
// import dotenv from "dotenv";
// import { PassThrough } from "stream";
// import ffmpeg from "fluent-ffmpeg";
// import ffmpegStatic from "ffmpeg-static";
// import { fileTypeFromBuffer } from "file-type";
// import path from "path";

// dotenv.config();

// const app = express();

// app.use(express.json());

// const __dirname = path.resolve();
// const PORT = process.env.PORT;

// app.use(express.static(path.join(__dirname, "/client/build")));

// app.get("/download", async (req, res) => {
//   const { url } = req.query;

//   try {
//     if (!ytdl.validateURL(url)) {
//       throw new Error("Invalid YouTube URL");
//     }

//     const info = await ytdl.getInfo(url);
//     const title = info.videoDetails.title;
//     const thumbnails = info.videoDetails.thumbnails;
//     const thumbnailUrl = thumbnails[thumbnails.length - 1].url;

//     // Download the audio
//     const audioStream = ytdl(url, { filter: "audioonly" });
//     const audioBuffer = await streamToBuffer(audioStream);

//     // Detect the file type
//     const type = await fileTypeFromBuffer(audioBuffer);

//     // If the file type is not audio, re-encode it to MP3
//     if (!type.mime.startsWith("audio/")) {
//       const mp3Buffer = await reencodeToMP3(audioBuffer);
//       const mp3Type = await fileTypeFromBuffer(mp3Buffer);

//       if (mp3Type.mime !== "audio/mpeg") {
//         throw new Error("Invalid audio file type after re-encoding");
//       }

//       const assemblyResponse = await sendToAssemblyAI(mp3Buffer, mp3Type);
//       const transcriptId = assemblyResponse.data.id;

//       const transcription = await getTranscription(transcriptId);

//       res.json({
//         title,
//         thumbnailUrl,
//         text: transcription.text,
//       });
//     } else {
//       const assemblyResponse = await sendToAssemblyAI(audioBuffer, type);
//       const transcriptId = assemblyResponse.data.id;

//       const transcription = await getTranscription(transcriptId);

//       res.json({
//         title,
//         thumbnailUrl,
//         text: transcription.text,
//       });
//     }
//   } catch (error) {
//     console.error("Error downloading audio:", error.message);
//     res.status(500).send("Error downloading audio");
//   }
// });

// const streamToBuffer = (stream) => {
//   return new Promise((resolve, reject) => {
//     const bufferArray = [];
//     stream.on("data", (chunk) => bufferArray.push(chunk));
//     stream.on("end", () => resolve(Buffer.concat(bufferArray)));
//     stream.on("error", reject);
//   });
// };

// // Set ffmpeg path from ffmpeg-static
// ffmpeg.setFfmpegPath(ffmpegStatic);

// const reencodeToMP3 = (inputBuffer) => {
//   return new Promise((resolve, reject) => {
//     const outputStream = new PassThrough();
//     const chunks = [];

//     ffmpeg()
//       .input(new PassThrough().end(inputBuffer))
//       .outputFormat("mp3")
//       .on("error", reject)
//       .on("end", () => resolve(Buffer.concat(chunks)))
//       .pipe(outputStream);

//     outputStream.on("data", (chunk) => chunks.push(chunk));
//     outputStream.on("end", () => resolve(Buffer.concat(chunks)));
//   });
// };

// const sendToAssemblyAI = async (audioBuffer, type) => {
//   const formData = new FormData();
//   formData.append("audio", audioBuffer, {
//     filename: "audio.mp3",
//     contentType: type.mime,
//   });

//   const uploadResponse = await axios.post(
//     "https://api.assemblyai.com/v2/upload",
//     formData,
//     {
//       headers: {
//         ...formData.getHeaders(),
//         authorization: process.env.ASSEMBLYAI_API_KEY,
//       },
//     }
//   );

//   const audioUrl = uploadResponse.data.upload_url;

//   const transcriptionResponse = await axios.post(
//     "https://api.assemblyai.com/v2/transcript",
//     {
//       audio_url: audioUrl,
//     },
//     {
//       headers: {
//         authorization: process.env.ASSEMBLYAI_API_KEY,
//       },
//     }
//   );

//   return transcriptionResponse;
// };

// const getTranscription = async (transcriptId) => {
//   let status = "processing";
//   let transcription = null;

//   while (status === "processing" || status === "queued") {
//     await new Promise((resolve) => setTimeout(resolve, 5000));

//     const response = await axios.get(
//       `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
//       {
//         headers: {
//           authorization: process.env.ASSEMBLYAI_API_KEY,
//         },
//       }
//     );

//     status = response.data.status;
//     transcription = response.data;

//     if (status === "error") {
//       console.error("Transcription error details:", transcription);
//       throw new Error("Transcription failed");
//     }
//   }

//   if (status === "completed") {
//     return transcription;
//   } else {
//     throw new Error("Transcription failed");
//   }
// };

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "build", "index.html"));
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// server.js

// import express from "express";
// import axios from "axios";
// import FormData from "form-data";
// import dotenv from "dotenv";
// import { exec } from "child_process";
// import fs from "fs";
// import path from "path";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 4000;

// app.use(express.json());

// const __dirname = path.resolve();
// app.use(express.static(path.join(__dirname, "/client/build")));

// const downloadAudio = async (url, output) => {
//   return new Promise((resolve, reject) => {
//     const pythonExecutable = path.join(__dirname, "venv", "bin", "python3");
//     const scriptPath = path.join(__dirname, "download_audio.py");
//     exec(
//       `${pythonExecutable} ${scriptPath} ${url} ${output}`,
//       (error, stdout, stderr) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(output);
//         }
//       }
//     );
//   });
// };

// const uploadToAssemblyAI = async (filePath) => {
//   const form = new FormData();
//   form.append("audio", fs.createReadStream(filePath));

//   const response = await axios.post(
//     "https://api.assemblyai.com/v2/upload",
//     form,
//     {
//       headers: {
//         ...form.getHeaders(),
//         authorization: process.env.ASSEMBLYAI_API_KEY,
//       },
//     }
//   );

//   return response.data.upload_url;
// };

// const getTranscription = async (audioUrl) => {
//   const response = await axios.post(
//     "https://api.assemblyai.com/v2/transcript",
//     { audio_url: audioUrl },
//     { headers: { authorization: process.env.ASSEMBLYAI_API_KEY } }
//   );

//   const { id } = response.data;

//   let status = "processing";
//   while (status === "processing" || status === "queued") {
//     await new Promise((resolve) => setTimeout(resolve, 5000));
//     const res = await axios.get(
//       `https://api.assemblyai.com/v2/transcript/${id}`,
//       {
//         headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
//       }
//     );
//     status = res.data.status;
//     if (status === "completed") return res.data.text;
//   }

//   throw new Error("Transcription failed");
// };

// app.get("/download", async (req, res) => {
//   const { url } = req.query;
//   try {
//     // const videoId = new URL(url).searchParams.get("v");
//     const videoId = getVideoIdFromUrl(url);
//     const videoMeta = await axios.get(
//       `https://www.googleapis.com/youtube/v3/videos`,
//       {
//         params: {
//           id: videoId,
//           key: process.env.YOUTUBE_API_KEY,
//           part: "snippet",
//         },
//       }
//     );

//     const { title, thumbnails } = videoMeta.data.items[0].snippet;
//     const thumbnailUrl = thumbnails.high.url;

//     const output = path.join(__dirname, "audio.mp3.mp3");
//     await downloadAudio(url, output);
//     const audioUrl = await uploadToAssemblyAI(output);
//     const transcription = await getTranscription(audioUrl);

//     res.json({ title, thumbnailUrl, transcription });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send("Error generating article");
//   }
// });

// const getVideoIdFromUrl = (url) => {
//   const match = url.match(
//     /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/[^/]+\/|(?:v|e(?:mbed)?)\/|[^?]*[?](?:.*&)?v=|[^/]+\/(?:[^/]+\/)*)|youtu\.be\/)([^"&?/\s]{11})/
//   );
//   return match ? match[1] : null;
// };

// // Serve client build files
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "build", "index.html"));
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

import express from "express";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "/client/build")));

const downloadAudio = async (url, output) => {
  return new Promise((resolve, reject) => {
    // const pythonExecutable = path.join(__dirname, "myenv", "bin", "python3");
    const pythonExecutable = "python3"; // Use system Python
    const scriptPath = path.join(__dirname, "download_audio.py");
    exec(
      `${pythonExecutable} ${scriptPath} ${url} ${output}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(output);
        }
      }
    );
  });
};

const uploadToAssemblyAI = async (filePath) => {
  const form = new FormData();
  form.append("audio", fs.createReadStream(filePath));

  const response = await axios.post(
    "https://api.assemblyai.com/v2/upload",
    form,
    {
      headers: {
        ...form.getHeaders(),
        authorization: process.env.ASSEMBLYAI_API_KEY,
      },
    }
  );

  return response.data.upload_url;
};

const getTranscription = async (audioUrl) => {
  const response = await axios.post(
    "https://api.assemblyai.com/v2/transcript",
    { audio_url: audioUrl },
    { headers: { authorization: process.env.ASSEMBLYAI_API_KEY } }
  );

  const { id } = response.data;

  let status = "processing";
  while (status === "processing" || status === "queued") {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const res = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${id}`,
      {
        headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
      }
    );
    status = res.data.status;
    if (status === "completed") return res.data.text;
  }

  throw new Error("Transcription failed");
};

app.get("/download", async (req, res) => {
  const { url } = req.query;
  try {
    const videoId = getVideoIdFromUrl(url);
    const videoMeta = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          id: videoId,
          key: process.env.YOUTUBE_API_KEY,
          part: "snippet",
        },
      }
    );

    const { title, thumbnails } = videoMeta.data.items[0].snippet;
    const thumbnailUrl = thumbnails.high.url;

    const output = path.join(__dirname, "audio.mp3.mp3.mp3");
    await downloadAudio(url, output);
    const audioUrl = await uploadToAssemblyAI(output);
    const transcription = await getTranscription(audioUrl);

    res.json({ title, thumbnailUrl, transcription });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Error generating article");
  }
});

const getVideoIdFromUrl = (url) => {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/[^/]+\/|(?:v|e(?:mbed)?)\/|[^?]*[?](?:.*&)?v=|[^/]+\/(?:[^/]+\/)*)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return match ? match[1] : null;
};

app.get("/fetch-image", async (req, res) => {
  const { url } = req.query;
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Error fetching image");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
