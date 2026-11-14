"use client";
import type { AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

type Progress = (message: string, percent?: number) => void;
let transcriber: Promise<AutomaticSpeechRecognitionPipeline> | undefined;

export async function transcribeFile(file: File, onProgress: Progress): Promise<string> {
  if (typeof window === "undefined") throw new Error("Open this file in your browser to read its audio.");
  if (!/\.(mp4|mov|webm|m4a|mp3)$/i.test(file.name)) throw new Error("Choose an MP4, MOV, WebM, M4A or MP3 file.");
  if (file.size > 100 * 1024 * 1024) throw new Error("Choose a file no larger than 100 MB.");
  onProgress("Reading audio…");
  let context: AudioContext | undefined;
  let audio: AudioBuffer;
  try {
    context = new AudioContext({ sampleRate: 16000 });
    audio = await context.decodeAudioData(await file.arrayBuffer());
  } catch { throw new Error("Your browser cannot read this audio codec. Try an MP4 or MP3 with audio, or use a screenshot."); }
  finally { if (context) await context.close().catch(() => undefined); }
  if (audio.duration > 180) throw new Error("Choose a clip no longer than 3 minutes.");
  if (!audio.length || !audio.numberOfChannels) throw new Error("No speech found. Try a clip with clear speech or use a screenshot.");
  const mono = new Float32Array(audio.length);
  for (let channel = 0; channel < audio.numberOfChannels; channel++) {
    const samples = audio.getChannelData(channel);
    for (let i = 0; i < mono.length; i++) mono[i] += samples[i] / audio.numberOfChannels;
  }
  if (!mono.some(sample => Math.abs(sample) > 0.001)) throw new Error("No speech found. Try a clip with clear speech or use a screenshot.");
  onProgress("Loading the speech model (first time only)");
  if (!transcriber) {
    transcriber = (async () => {
      const { pipeline } = await import("@huggingface/transformers");
      return pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny.en", {
        dtype: "q8",
        progress_callback: info => {
          if ("progress" in info) onProgress("Loading the speech model (first time only)", Math.round(info.progress));
        },
      });
    })();
  }
  let model: AutomaticSpeechRecognitionPipeline;
  try { model = await transcriber; }
  catch { transcriber = undefined; throw new Error("The speech model could not load. Check your connection and retry."); }
  onProgress("Listening…");
  let text: string;
  try { text = (await model(mono, { chunk_length_s: 30, stride_length_s: 5 })).text.trim(); }
  catch { throw new Error("Could not read the speech. Try a shorter clip or use a screenshot."); }
  if (!text) throw new Error("No speech found. Try a clip with clear speech or use a screenshot.");
  return text;
}
