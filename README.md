# Code Keyframes

A browser based tool for running JavaScript code at specific frames of an audio track. This is useful for creating interactive music videos, making subtitles, or anything else where audiovisual synchronization is required.

## Demo

[Minimal Demo](http://gridav.net/codekeyframes-demo)

## How-To

1. Include the js file and the css file from the repository:
- [codeKeyframes.min.js](https://github.com/gridwalk/codekeyframes/releases/latest)
- [codeKeyframes.css](https://github.com/gridwalk/codekeyframes/releases/latest)

2. Initialize an instance of CodeKeyframes:

```javascript
var ckf = new CodeKeyframes({
  audioPath:     'audio/yourMusic.mp3',
  editorOpen:    true,
  waveColor:     '#3AEAD2',
  progressColor: '#0c9fa7',
  bgColor:       '#222',
  label:         'Text that appears at the top left of the waveform.',
  keyframes:[]   // paste in after exporting keyframes
})
```

3. Write your keyframes in the browser. The tool is keyboard controlled. See controls below.

4. Click EXPORT KEYFRAMES and paste the resulting code as your keyframes array from when you initialized the instance. This saves your keyframes out of localStorage and into a variable.

5. Change `editorOpen` to `false` and your keyframes will still run while only showing the audio waveform without the editor.

## Controls

Make sure you click the waveform before using keyboard controls. This choice was to avoid adding event listeners to the entire page, to prevent overlap with any other controls that you might use on the page.

`Left & Right` : Move playhead<br>
`Shift + Left or Right ` : Nudge playhead<br>
`Up & Down` : Zoom waveform<br>
`Space` : Play / Pause<br>
`Enter` : Add keyframe<br>
`Page Up & Page Down` : Jump between keyframes
`[ and ]` : Jump between keyframes
`Alt + Left or Right` : Nudge active keyframe

## Acknowledgements

This tool relies hugely on [Wavesurfer](https://wavesurfer-js.org/). Big thanks to [katspaugh](https://github.com/katspaugh/wavesurfer.js) for their work on it.

The repository build structure is based on [Net Art Starter](https://github.com/gridwalk/net-art-starter) by me Donald Hanson. You can learn more about the structure and use it yourself.
