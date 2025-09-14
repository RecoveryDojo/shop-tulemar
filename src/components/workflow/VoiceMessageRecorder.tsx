import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Send, 
  X, 
  RotateCcw,
  Volume2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceMessageRecorderProps {
  onClose: () => void;
  onSend: (audioBlob: Blob) => void;
}

export function VoiceMessageRecorder({ onClose, onSend }: VoiceMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setDuration(recordingTime);
        
        // Create audio URL for playback
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setPlaybackTime(audioRef.current.currentTime);
        }
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioBlob(null);
    setIsPlaying(false);
    setPlaybackTime(0);
    setDuration(0);
    setRecordingTime(0);
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlaybackProgress = () => {
    if (duration === 0) return 0;
    return (playbackTime / duration) * 100;
  };

  return (
    <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Message
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Recording Status */}
          <div className="text-center">
            {isRecording && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
                <Badge variant="destructive">{formatTime(recordingTime)}</Badge>
              </div>
            )}
            
            {audioBlob && !isRecording && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Recording Complete</div>
                <Badge variant="default">{formatTime(duration)}</Badge>
              </div>
            )}
            
            {!isRecording && !audioBlob && (
              <div className="text-sm text-muted-foreground">
                Tap the microphone to start recording
              </div>
            )}
          </div>

          {/* Playback Controls */}
          {audioBlob && (
            <div className="space-y-3">
              <Progress value={getPlaybackProgress()} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTime(playbackTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !audioBlob && (
              <Button 
                onClick={startRecording}
                size="lg"
                className="rounded-full w-16 h-16"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )}
            
            {isRecording && (
              <Button 
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16"
              >
                <Square className="h-8 w-8" />
              </Button>
            )}
            
            {audioBlob && (
              <>
                <Button 
                  onClick={resetRecording}
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                
                <Button 
                  onClick={isPlaying ? pauseAudio : playAudio}
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button 
                  onClick={sendVoiceMessage}
                  size="lg"
                  className="rounded-full w-12 h-12"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            {!audioBlob && !isRecording && (
              <>
                <div>• Tap microphone to start recording</div>
                <div>• Speak clearly for best quality</div>
                <div>• Maximum 60 seconds per message</div>
              </>
            )}
            {isRecording && (
              <div>Tap the square to stop recording</div>
            )}
            {audioBlob && (
              <>
                <div>• Play to review your message</div>
                <div>• Reset to record again</div>
                <div>• Send to deliver to stakeholders</div>
              </>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}