import { useCallback, useEffect, useState } from 'react';

// expo-speech-recognition ships a JS-level requireNativeModule call that throws
// inside Expo Go (because Expo Go doesn't ship the native voice module). We
// wrap the require in a try so the hook can detect "voice unavailable" and
// degrade gracefully — Expo Go users see an actionable message instead of a
// hard crash on any screen that imports this hook.
let SpeechRecognition = null;
try {
  SpeechRecognition = require('expo-speech-recognition');
} catch {
  SpeechRecognition = null;
}

export function useVoiceInput() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!SpeechRecognition) return undefined;
    const m = SpeechRecognition.ExpoSpeechRecognitionModule;
    const subs = [
      m.addListener('start', () => setListening(true)),
      m.addListener('end', () => setListening(false)),
      m.addListener('result', (event) => {
        const t = event.results?.[0]?.transcript ?? '';
        if (t) setTranscript(t);
      }),
      m.addListener('error', (event) => {
        setError(event.error || 'Voice recognition failed.');
        setListening(false);
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  const start = useCallback(async () => {
    if (!SpeechRecognition) {
      setError('Voice input requires a development build (not Expo Go).');
      return;
    }
    setError(null);
    setTranscript('');
    try {
      const m = SpeechRecognition.ExpoSpeechRecognitionModule;
      const perms = await m.requestPermissionsAsync();
      if (!perms.granted) {
        setError('Microphone or speech-recognition permission denied.');
        return;
      }
      m.start({
        lang: 'en-US',
        interimResults: false,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch (e) {
      setError(e?.message || 'Could not start voice recognition.');
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (!SpeechRecognition) return;
    try {
      SpeechRecognition.ExpoSpeechRecognitionModule.stop();
    } catch {
      // already stopped or transient error — ignore
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    listening,
    transcript,
    error,
    start,
    stop,
    reset,
    available: !!SpeechRecognition,
  };
}
