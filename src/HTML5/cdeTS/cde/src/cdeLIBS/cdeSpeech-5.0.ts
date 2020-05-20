// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

namespace cdeSpeech {

    export const synth = window.speechSynthesis;

    export function talk(text: string, lang = "en", voiceIdx = 0) {
        if (!text)
            return;
        try {
            if (synth.speaking) {
                return;
            }
            const utterThis = new SpeechSynthesisUtterance(text);
            //utterThis.onend = function (event) {
            //    console.log('talking done');
            //}
            //utterThis.onerror = function (event) {
            //    console.error('Talking error');
            //}
            const voices = synth.getVoices();
            //ES5:
            let v = voices[voiceIdx];
            for (const t in voices) {
                if (voices[t].lang.toLowerCase().startsWith(lang.toLowerCase())) {
                    v = voices[t];
                    break;
                }
            }
            //ES6: const v = voices.filter(x => x.lang.includes(lang))[voiceIdx];
            utterThis.voice = v;
            //utterThis.pitch = pitch.value;
            //utterThis.rate = rate.value;
            synth.speak(utterThis);
        }
        catch (exception) {
            //ignored
        }
    }
}