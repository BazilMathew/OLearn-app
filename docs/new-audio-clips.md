# New narration clips

Every tutorial now starts on a mock phone home screen. WhatsApp tutorials then scroll the chat list to find Ramesh's chat and open it. The 19 new steps have no recorded clip yet. Until they do, they show their caption only: no narration and no speech synthesis, and "Repeat Voice" is greyed out.

The text is the same in every WhatsApp task (steps 1 to 3) and in every Google Pay task (step 1). So only **4 clips per language** are needed: 12 files in all. Record them in the same voice as the existing clips.

The names follow the existing pattern `<app>_<flow>_step<N>.mp3`, with the flow called `start`. They go in the existing folders:

- `public/assets/audio/en/`
- `public/assets/audio/hi/`
- `public/assets/audio/ml/`

Existing clips stay on their steps and keep their names.

## Clips to record

| Clip file | English | Hindi | Malayalam |
|---|---|---|---|
| `wa_start_step1.mp3` | Tap the green WhatsApp icon. | हरे व्हाट्सएप आइकॉन पर टैप करें। | പച്ച വാട്ട്സ്ആപ്പ് ഐക്കണിൽ തൊടുക. |
| `wa_start_step2.mp3` | Swipe up to find your chat with Ramesh. | रमेश की चैट ढूँढने के लिए ऊपर की ओर स्वाइप करें। | രമേഷിന്റെ ചാറ്റ് കണ്ടെത്താൻ മുകളിലേക്ക് സ്വൈപ്പ് ചെയ്യുക. |
| `wa_start_step3.mp3` | Tap your chat with Ramesh. | रमेश की चैट पर टैप करें। | രമേഷിന്റെ ചാറ്റിൽ തൊടുക. |
| `gpay_start_step1.mp3` | Tap the blue Google Pay icon. | नीले गूगल पे आइकॉन पर टैप करें। | നീല ഗൂഗിൾ പേ ഐക്കണിൽ തൊടുക. |

## Where each clip is used

| Task id | Step | Clip |
|---|---|---|
| whatsapp_send_text | 1 | wa_start_step1.mp3 |
| whatsapp_send_text | 2 | wa_start_step2.mp3 |
| whatsapp_send_text | 3 | wa_start_step3.mp3 |
| whatsapp_send_photo | 1 | wa_start_step1.mp3 |
| whatsapp_send_photo | 2 | wa_start_step2.mp3 |
| whatsapp_send_photo | 3 | wa_start_step3.mp3 |
| whatsapp_voice_call | 1 | wa_start_step1.mp3 |
| whatsapp_voice_call | 2 | wa_start_step2.mp3 |
| whatsapp_voice_call | 3 | wa_start_step3.mp3 |
| whatsapp_video_call | 1 | wa_start_step1.mp3 |
| whatsapp_video_call | 2 | wa_start_step2.mp3 |
| whatsapp_video_call | 3 | wa_start_step3.mp3 |
| whatsapp_voice_message | 1 | wa_start_step1.mp3 |
| whatsapp_voice_message | 2 | wa_start_step2.mp3 |
| whatsapp_voice_message | 3 | wa_start_step3.mp3 |
| gpay_check_balance | 1 | gpay_start_step1.mp3 |
| gpay_scan_qr | 1 | gpay_start_step1.mp3 |
| gpay_send_contact | 1 | gpay_start_step1.mp3 |
| gpay_transaction_history | 1 | gpay_start_step1.mp3 |

## After recording

In `src/config/tasks.json`, these steps have empty `audio_en`, `audio_hi` and `audio_ml` fields. Fill them with the clip paths in the same form as the existing steps, for example:

```json
"audio_en": "assets/audio/en/wa_start_step1.mp3",
"audio_hi": "assets/audio/hi/wa_start_step1.mp3",
"audio_ml": "assets/audio/ml/wa_start_step1.mp3",
```

Once a step has a path, it plays its clip and "Repeat Voice" works again.
