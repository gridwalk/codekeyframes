# Code Keyframes

A browser based tool for running JavaScript code at specific frames of an audio or video track. This is useful for creating interactive music videos, making educational content, or anything else where audiovisual synchronization and interactivity is required.

![alt text](https://raw.githubusercontent.com/gridwalk/codekeyframes/master/dist/examples/threejs/poster.png "Codekeyframes Demo Screenshot")

## Examples

- [Basic Example](https://gridwalk.github.io/codekeyframes/dist/examples/basic)
- [Three JS Example](https://gridwalk.github.io/codekeyframes/dist/examples/threejs)

## How-To

1. Include the js file and the css file from the repository:
- [codeKeyframes.min.js](https://github.com/gridwalk/codekeyframes/releases/latest)
- [codeKeyframes.css](https://github.com/gridwalk/codekeyframes/releases/latest)

2. Initialize an instance of CodeKeyframes:

```javascript
var ckf = new CodeKeyframes({
  audioPath:     './path/to-audio.mp3',
  videoElement:  document.getElementById('some-video'), // if you want to sync to a video instead of an mp3
  editorOpen:    true,
  waveColor:     '#3AEAD2', // wave color right of the playhead
  progressColor: '#0c9fa7', // wave color left of the playhead
  bgColor:       '#222',    // color behind waveform
  label:         'Text that appears above the waveform',
  autoplay:      false,
  keyframes:     [], // paste in here after exporting keyframes,
  
  onCanPlay: function(){
  	console.log('onCanPlay triggered')
  },

  onPlay: function(){
  	console.log('onPlay triggered')
  },

  onPause: function(){
  	console.log('onPause triggered')
  },

  onFrame: function(){
  	console.log('onFrame triggered, do/render something')
  }
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
`Page Up & Page Down` : Jump between keyframes<br>
`[ and ]` : Jump between keyframes<br>
`Alt + Left or Right` : Nudge active keyframe<br>
`E` : Toggle editor view

## Acknowledgements

This tool relies hugely on [Wavesurfer](https://wavesurfer-js.org/). Big thanks to [katspaugh](https://github.com/katspaugh/wavesurfer.js) for their work on it.
