# MiMo TTS Studio - Shared Types

## Project
```json
{
  "name": "string",
  "time": "number (unix ms)",
  "chapters": ["Chapter"],
  "globalCharacters": "{ [name]: Character }"
}
```

## Chapter
```json
{
  "title": "string",
  "content": "string",
  "checked": "boolean",
  "mood": "string | null",
  "characterMap": "{ [name]: CharacterInfo } | null",
  "script": ["ScriptItem"] | null,
  "ttsPrompt": "string | null",
  "audioBlob": "Blob | null (client only)"
}
```

## CharacterInfo (from LLM analysis)
```json
{
  "gender": "男 | 女 | 未知",
  "age": "string",
  "role_tag": "重要角色 | 路人角色",
  "personality": "string (30-60 chars)",
  "timbre": "string"
}
```

## Character (global registry)
```json
{
  "name": "string",
  "gender": "string",
  "age": "string",
  "role_tag": "string",
  "personality": "string",
  "timbre": "string",
  "voiceDesignPrompt": "string | null",
  "ttsStyle": "string | null",
  "chapters": ["number (indices)"]
}
```

## ScriptItem
```json
{
  "speaker": "string (旁白 or character name)",
  "speaker_emo": "string (emotion tag)",
  "content": "string",
  "emo_vector": "[number] (8 floats: 喜怒哀惧厌恶低落惊喜平静)",
  "delay": "number (ms, 150-1000)",
  "_voiceAssignment": "{ type: 'preset'|'voicedesign', voice?: string, prompt?: string }"
}
```

## VoiceAssignment
```json
{
  "type": "preset | voicedesign | needs_design",
  "voice": "string (preset voice name)",
  "prompt": "string (voice design prompt)"
}
```

## API Endpoints

### TTS
- `POST /api/tts/synthesize` - Basic TTS synthesis
- `POST /api/tts/voice-design` - Voice design with preview
- `POST /api/tts/voice-clone` - Voice clone synthesis
- `POST /api/tts/batch` - Batch chapter synthesis

### LLM
- `POST /api/llm/analyze-chapter` - Emotion/script analysis
- `POST /api/llm/voice-design` - Generate voice design prompts
- `POST /api/llm/test` - Test LLM connection

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:name` - Get project
- `PUT /api/projects/:name` - Save project
- `DELETE /api/projects/:name` - Delete project
- `GET /api/projects/:name/audio/:chapter` - Get chapter audio
