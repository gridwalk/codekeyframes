# Code Keyframes

A browser based tool for running JavaScript code at specific frames of an audio track. This is useful for creating interactive music videos, making subtitles, or anything else where audiovisual synchronization is required.

## How-To

1. Include the js file and the css file from the repository. (Links coming soon)
2. Initialize an instance of CodeKeyframes:

```javascript
var ckf = new CodeKeyframes({
  audioPath:     'audio/yourMusic.mp3',
  editorOpen:    true,
  waveColor:     '#3AEAD2',
  progressColor: '#0c9fa7',
  bgColor:       '#222',
  keyframes:[]   // paste in after exporting keyframes
})
```

3. Write your keyframes in the browser. The tool is keyboard controlled. See controls below.

4. Click EXPORT KEYFRAMES and paste the resulting code as your keyframes array from when you initialized the instance. This saves your keyframes out of localStorage and into a variable.

5. Change `editorOpen` to `false` and your keyframes will still run while only showing the audio waveform without the editor.

## Controls

Make sure you click the waveform before using keyboard controls. This choice was to avoid adding event listeners to the entire page, to prevent overlap with any other controls that you might use on the page.

`Left & Right` : Move playhead
`Shift + Left or Right ` : Nudge playhead
`Up & Down` : Zoom waveform
`Space` : Play / Pause
`Enter` : Add keyframe
`Page Up & Page Down` : Jump between keyframes

## Acknowledgements

This tool relies hugely on [Wavesurfer](https://wavesurfer-js.org/). Big thanks to [katspaugh](https://github.com/katspaugh/wavesurfer.js) for their work on it.

The repository build structure is based on [Net Art Starter](https://github.com/gridwalk/net-art-starter) by me Donald Hanson. You can learn more about the structure and use it yourself.