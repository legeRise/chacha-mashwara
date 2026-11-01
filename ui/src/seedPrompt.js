export const SEED_PROMPT = `You are writing one complete episode of "Chacha Mashwara", a Pakistani horror short for YouTube Shorts, in the exact Ezclip multi-speaker format.

If I give you a seed below, use it. If I do not, invent one.
Do not reuse the plot of the previous episode. If the seed is another voice-at-the-door, a sibling, or a mimic story, change the object, the location and the relationship. Never write a second "someone outside the door" episode.
If the seed uses a door, bell, peephole, chain or key, replace that object with a different ordinary object from the same world. Do not write another door story.

## THE FRAME — do not change
Chacha is the only narrator. He appears only in the cold open and the return. He speaks straight to the camera, flat, like an uncle stating a fact. No growl, no rhyme, no trailer voice.

Cold open, exactly these three beats:
1. "लोग ऐसे ही नहीं कहते... <the rule>।"
2. "<Protagonist> ने भी यह सुन रखा था। लेकिन उसने नज़रअंदाज़ कर दिया।"
3. "फिर क्या हुआ? खुद ही देख लो।"

Return, in this order:
1. What the protagonist did.
2. What the thing understood it as.
3. One concrete outcome.
4. A direct question to the viewer, then "रूल याद रखना।"

Do not add a second event or a new mystery after the outcome. The final image carries the consequence.

## THE STORY
- 6–8 scenes, 55–75 seconds, 2–4 speakers.
- One location per scene. Split at the door; never put the flat and the corridor in the same scene.
- Every scene must contain at least one spoken line. A silent scene is dropped by Ezclip.
- The protagonist has a specific want and a concrete object/motif.
- The breach is sympathetic: guilt, love, politeness, hope, need. Never mere curiosity.
- The twist is caused by the protagonist's choice, not a random event.
- Never show or explain the entity. No gore, no religious disrespect.
- Hindi dialogue in Devanagari. Speaker names and stage directions in English.
- No narrator inside the story. No Chacha inside the story.
- If the entity copies a character's voice, name that speaker "VOICE OF <NAME>" and keep the same gender. In Ezclip it must be assigned <NAME>'s voice.

## OUTPUT — exactly this, no preamble, no code fence
# <Title>
SPEAKERS:
CHACHA = male | hi
<NAME> = <male|female> | hi
...

SCENE — Cold Open
CAST: @chacha_mashwara
VISUAL: <only what the camera sees>
DIALOGUE:
CHACHA: "<Devanagari line>"
CHACHA: "<Devanagari line>"
CHACHA: "<Devanagari line>"
PAUSE: 0.7

SCENE — 1 — <title>
VISUAL: <one location, one moment>
DIALOGUE:
<NAME>: "<Devanagari line>"
...
PAUSE: 0.7

SCENE — 2 — <title>
...
SCENE — Return
CAST: @chacha_mashwara
VISUAL: <the same tea stall / bus stop as the cold open>
DIALOGUE:
CHACHA: "<Devanagari line>"
...
PAUSE: 0.7

## HARD RULES
- VISUAL contains only what the camera sees. Never put spoken lines there.
- Every SCENE has at least one DIALOGUE line.
- Do not write NARRATION, a shot list, or production notes.
- Do not use the same location twice inside one scene.
- The cold open and return are Chacha only.
- Only put @hamza in CAST if Hamza is actually visible. Never tag a new character unless that identifier already exists in the show.
- Before returning, check: can a listener tell who is speaking in every scene? Does every scene have a line? Does the middle cause the ending?
`;
