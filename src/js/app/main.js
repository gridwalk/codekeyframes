function CodeKeyframes(args){

  if( !args.audioPath ) return

  this.audioPath  = args.audioPath
  this.editorOpen = args.editorOpen || false
  this.keyframes  = args.keyframes  || []
  this.label      = args.label
  this.autoplay   = args.autoplay   || false
  this.state      = args.state      || {}

  // event callbacks
  this.onFrame    = args.onFrame    || function(){}
  this.onCanPlay  = args.onCanPlay  || function(){}
  this.onPause    = args.onPause    || function(){}
  this.onPlay     = args.onPlay     || function(){}

  this.activeRegion = null
  this.skipLength   = 1
  this.zoom         = 30
  this.nudging      = false
  this.nudgeMult    = 1

  this.sequence         = []
  this.sequenceCursor   = 0
  this.sequenceNextTime = null

  // insert editor HTML
  document.querySelector('body').insertAdjacentHTML('beforeend',`
    <div class="ckf-panel">
      <div class="ckf-waveform" tabindex="0"></div>
      <div class="ckf-toolbox">
	    	<div class="code-editor">
	        <textarea name="code" id="code" cols="30" rows="10"></textarea>
	    	</div>
	    	<div class="state-editor">
					<div class="state-header">
						<span>Name</span>
						<span>Value</span>
						<span class="smooth"></span>
					</div>
	    	</div>
	      <div class="controls">
	        <a href="#" class="render">Export Keyframes</a>
	        <a href="#" class="close">Toggle Editor (E)</a>
	      </div>
      </div>
    </div>`)

  this._panel        = document.querySelector('.ckf-panel')
  this._code         = document.querySelector('.ckf-panel #code')
  this._codeEditor   = document.querySelector('.ckf-panel .code-editor')
  this._stateEditor  = document.querySelector('.ckf-panel .state-editor')
  this._renderButton = document.querySelector('.ckf-panel .render')
  this._closeButton  = document.querySelector('.ckf-panel .close')

  if( this.label ){
    _label = document.createElement('div')
    _label.innerHTML = this.label
    _label.classList.add('ckf-label')
    this._panel.appendChild(_label)
  }

  // immediately close editor if needed
  if( !this.editorOpen ){
  	this.toggleEditor()
  }

  
  /*
  
  ███████╗██╗     ███████╗███╗   ███╗███████╗███╗   ██╗████████╗
  ██╔════╝██║     ██╔════╝████╗ ████║██╔════╝████╗  ██║╚══██╔══╝
  █████╗  ██║     █████╗  ██╔████╔██║█████╗  ██╔██╗ ██║   ██║   
  ██╔══╝  ██║     ██╔══╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   
  ███████╗███████╗███████╗██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   
  ╚══════╝╚══════╝╚══════╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   
                                                                
  ███████╗██╗   ██╗███████╗███╗   ██╗████████╗███████╗          
  ██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝          
  █████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║   ███████╗          
  ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ╚════██║          
  ███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║   ███████║          
  ╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝          
  
  */                                                            

  // save regions on keyup
  this._code.onkeyup = (e) => {

  	console.log('code keyup')
  	
  	if( !this.activeRegion ){
  		console.warn('No keyframe selected')
  		return
  	}

  	this.activeRegion.data.code = this._code.value
    this.saveRegions()
    this.updateSequence()
    this.runRegionCode(this.activeRegion)
  }

  this._code.onkeydown = (e) => {
    // prevent keystrokes from running other functions
    // but allow page up/down
    if( e.which == 33 ) return
    if( e.which == 34 ) return
    e.stopPropagation()
  }  

  this._stateEditor.oninput = (e) => {

  	var stateValue = e.target.value
  	var stateKey   = e.target.getAttribute('key')

  	if( !this.activeRegion.data.state ) this.activeRegion.data.state = {}

  	if( stateKey == null ) return

  	this.activeRegion.data.state[stateKey] = stateValue
  	this.saveRegions()
    this.runRegionCode(this.activeRegion)
  }

  this._renderButton.onclick = (e) => {
    var keyframes = []
    var regions = this.wavesurfer.regions.list
    for( var key in this.wavesurfer.regions.list ){
      var region = this.wavesurfer.regions.list[key]
      keyframes.push({
        start:region.start.toFixed(2),
        end:region.end.toFixed(2),
        data:region.data
      })
    }

    this.activeRegion = null
    this._code.value = JSON.stringify(keyframes)
    this._code.select()

    this._codeEditor.classList.add('exported')

  }

  this._closeButton.onclick = (e) => {
  	this.toggleEditor()
  }

  document.addEventListener('keydown', (e) => {

  	// Controls only when waveform is focused
  	var waveformFocusControls = {
      
      // left
      37:()=>{ 
        if( this.nudging ){
          this.nudgeActiveRegion('left')
        }else{
          this.wavesurfer.skip(this.skipLength*-1)  
        }        
      },

      // right
      39:()=>{
        if( this.nudging ){
          this.nudgeActiveRegion('right')
        }else{ 
          this.wavesurfer.skip(this.skipLength)
        }
      },

      // up
      38:()=>{ 
        this.zoom += 0.5
        this.nudgeMult = this.nudgeMult * 0.985
        this.wavesurfer.zoom(this.zoom)
      },

      // down
      40:()=>{ 
        this.zoom -= 0.5
        this.nudgeMult = this.nudgeMult * 1.025
        this.wavesurfer.zoom(this.zoom)
      },

      // shift
      16:()=>{
        this.skipLength = 0.1
        e.preventDefault()
      },

      // alt
      18:()=>{
        this.nudging = true
        // alert(this.nudging)
        e.preventDefault()
      },

      // delete
      46:()=>{
        this.activeRegion.remove()
        this.saveRegions()
        this.updateSequence()
      },
      
      // delete (backspace)
      8:()=>{
        this.activeRegion.remove()
        this.saveRegions()
        this.updateSequence()
      },

      // enter
      13:()=>{
        
        var region = this.wavesurfer.addRegion({
          start:  this.wavesurfer.getCurrentTime(),
          end:    this.wavesurfer.getCurrentTime()+0.1,
          drag:   false,
          resize: false,
          data:{
            code:this._code.value
          }
        })

        this.activateRegion(region)
        this.saveRegions()
        this.updateSequence()
      },

  	}


  	// controls when editor is open
    var editorOpenControls = {

      // page up
      33:()=>{
        this.activateRegion( this.getNextRegion() )
      },

      // page down
      34:()=>{
        this.activateRegion( this.getPrevRegion() )
      },

      // left bracket
      219:()=>{
        this.activateRegion( this.getPrevRegion() )
      },

      // right bracket
      221:()=>{
        this.activateRegion( this.getNextRegion() )
      },
    }
  	
  	// controls that trigger even if editor is closed
  	var globalControls ={
      
      // space
      32:()=>{
        this.wavesurfer.playPause()
        this._code.classList.remove('error')
      },
      
      // E (toggle editor)
      69:()=>{
        this.toggleEditor()
      },
  	}

  	// do global controls
  	if( globalControls[e.which] ) globalControls[e.which]()

  	// do controls when editor is open
  	if( this.editorOpen && editorOpenControls[e.which] ) editorOpenControls[e.which]()

  	// get focused element for area-specific controls
    var activeElement = document.activeElement

    // do waveform controls only if waveform is focused
    if( activeElement.classList.contains('ckf-waveform') && waveformFocusControls[e.which] ){
			waveformFocusControls[e.which]()
    }

  })

  document.addEventListener('keyup', (e) =>{

  	if( !this.editorOpen ) return

    var keycodes = {
      // shift
      16:()=>{
        this.skipLength = 1
      },

      // alt
      18:()=>{
        this.nudging = false
      },
    }

    if( keycodes[e.which] ){
      keycodes[e.which]()
    }
  })


  /*

  ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ ███████╗
  ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗██╔════╝
  ██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║███████╗
  ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║╚════██║
  ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝███████║
  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
  
  */

  this.saveRegions = ()=>{

    if( !this.editorOpen ) return

    localStorage.regions = JSON.stringify(
      Object.keys( this.wavesurfer.regions.list ).map( (id)=>{

        var region = this.wavesurfer.regions.list[id]
        return {
          start: region.start.toFixed(2),
          end:   region.end.toFixed(2),
          data:  region.data
        }
      })
    )
  }

  this.loadRegions = function(regions){

  	// load regions from saved code in declaration
    var keyframeRegions = this.keyframes

    // load regions from localstorage
    var localRegions = []
    if( localStorage.regions && this.editorOpen ) {
      localRegions = JSON.parse(localStorage.regions)
    }

    // combine and deduplicate
    var combinedRegions = []

    var arr = keyframeRegions.concat(localRegions)
    var len = arr.length
    while (len--) {
      var itm = arr[len]
      unique = true
      for (var i = combinedRegions.length - 1; i >= 0; i--) {
        if( combinedRegions[i].start == itm.start ){
          unique = false
        }
      }
      if( unique ) combinedRegions.unshift(itm)
    }

    combinedRegions.forEach((region) => {
      this.wavesurfer.addRegion({
        start:  region.start,
        end:    region.end,
        data:   region.data,
        drag:   true,
        resize: false
      })
    })
  }

  this.updateSequence = () => {

    this.sequence = []

    var regions = this.wavesurfer.regions.list
    for( var key in regions ){
      // convert regions to commands and add to sequence

      console.log(regions[key].data.state)

      var command = {
        time: regions[key].start,
        code: regions[key].data.code,
        state: regions[key].data.state
      }
      this.sequence.push(command)
    }

    this.sequence.sort(function(a,b){
      if( a.time > b.time ) return 1
      if( a.time < b.time ) return -1
      if( a.time == b.time ) return 0
    })

    // update sequence cursor
    this.sequenceCursor = 0
    var playheadTime = this.wavesurfer.getCurrentTime()

    for (var i = 0; i < this.sequence.length; i++) {
      var commandTime = this.sequence[this.sequenceCursor].time
      if( commandTime < playheadTime ){
        this.sequenceCursor++
      }else{
        break
      }
    }
  }

  this.nudgeActiveRegion = (direction) => {

    region = this.activeRegion

    nudgeAmount = 0.1 * this.nudgeMult
    if( direction == 'left' ) nudgeAmount = nudgeAmount * -1

    // nudgeAmount = (direction == 'left') ? -.1 : .1

    this.activeRegion = this.wavesurfer.addRegion({
      start:  region.start + nudgeAmount,
      end:    region.end +nudgeAmount,
      data:   region.data,
      drag:   false,
      resize: false
    })

    this.activeRegion.element.classList.add('active')
    region.remove()
    this.saveRegions()

  }

  this.activateRegion = function(region, seek = true) {

    if(!region) return
    
    // turn off copy keyframes message in editor
    this._codeEditor.classList.remove('exported')

    // execute the keyframe code
    this.runRegionCode(region)

    if( !this.editorOpen ) return

    // remove active class from all regions
    _regions = this._panel.querySelectorAll('region')
    for (var i = _regions.length - 1; i >= 0; i--) {
      _regions[i].classList.remove('active')
    }
    
    region.element.classList.add('active')

    // seek to region start
    if( seek ){
      this.wavesurfer.seekAndCenter( (region.start / this.wavesurfer.getDuration()))
    }

    // show the code for this region
    this._code.value = region.data.code

    // update the state panel display
	  this.updateStatePanel(region.data.state)

    // set active region
    this.activeRegion = region
    
  }

  this.runRegionCode = function(region){

    this._code.classList.remove('error')
      
    try{
      eval(region.data.code)
    } catch(error){
      this._code.classList.add('error')
      console.log(error)
    }

    // sync the internal state to this region
    if( region.data.state ){
	    for (var stateKey in region.data.state) {
			  this.state[stateKey] = region.data.state[stateKey]
			}    	
    }

    this.onFrame()
  }

  this.getNextRegion = function(){

    if( !this.editorOpen ) return

    var currentTime = -1
    if( this.activeRegion ){
      currentTime = this.activeRegion.start  
    }

    var regionsAfter = []

    for( var key in this.wavesurfer.regions.list ){
      var region = this.wavesurfer.regions.list[key]
      if( region.start > currentTime ) regionsAfter.push(region)
    }

    regionsAfter.sort(function(a,b){
      if( a.start > b.start ) return 1
      if( a.start < b.start ) return -1
      if( a.start == b.start ) return 0
    })  

    return regionsAfter[0]
  }


  this.getPrevRegion = function(){

    if( !this.editorOpen ) return

    var currentTime = 9999999
    if( this.activeRegion ){
      currentTime = this.activeRegion.start
    }

    var regionsBefore = []

    for( var key in this.wavesurfer.regions.list ){
      var region = this.wavesurfer.regions.list[key]
      if( region.start < currentTime ) regionsBefore.push(region)
    }

    regionsBefore.sort(function(a,b){
      if( a.start < b.start ) return 1
      if( a.start > b.start ) return -1
      if( a.start == b.start ) return 0
    })

    return regionsBefore[0]
  }

  this.toggleEditor = () => {
  	this._panel.classList.toggle('closed')
    this.editorOpen = !this.editorOpen
  }

  this.updateStatePanel = (regionState) => {

  	// default to initial state 
  	// if(!regionState){
  	// 	console.log('No region state passsed to render. Defaulting to initial/current state.')
  		regionState = this.state
  	// }

  	// remove previous items
  	var _stateItems = document.querySelectorAll('.state-item')
  	for (var i = _stateItems.length - 1; i >= 0; i--) {
  		_stateItems[i].remove()
  	}

  	for (var property in regionState) {

  		this._stateEditor.insertAdjacentHTML('beforeend',`
		    <div class="state-item">
		      <span>${property}</span>
		      <input type="number" key="${property}" step="0.1" value="${regionState[property]}" />
		      <input type="checkbox" />
		    </div>`)

		}
  }

  /*

  ██╗    ██╗ █████╗ ██╗   ██╗███████╗███████╗██╗   ██╗██████╗ ███████╗███████╗██████╗ 
  ██║    ██║██╔══██╗██║   ██║██╔════╝██╔════╝██║   ██║██╔══██╗██╔════╝██╔════╝██╔══██╗
  ██║ █╗ ██║███████║██║   ██║█████╗  ███████╗██║   ██║██████╔╝█████╗  █████╗  ██████╔╝
  ██║███╗██║██╔══██║╚██╗ ██╔╝██╔══╝  ╚════██║██║   ██║██╔══██╗██╔══╝  ██╔══╝  ██╔══██╗
  ╚███╔███╔╝██║  ██║ ╚████╔╝ ███████╗███████║╚██████╔╝██║  ██║██║     ███████╗██║  ██║
   ╚══╝╚══╝ ╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
                                                                                      
  */

  var waveHeight = 100
  if( !this.editorOpen ){
    waveHeight = 30
  }

  var waveColor     = args.waveColor     || '#3AEAD2'
  var progressColor = args.progressColor || '#0c9fa7'

  this.wavesurfer = WaveSurfer.create({
      container:     '.ckf-waveform',
      height:        waveHeight,
      scrollParent:  true,
      normalize:     true,
      waveColor:     waveColor,
      progressColor: progressColor,
      barWidth:      1,
      cursorColor:   '#fff',
      plugins: [WaveSurfer.cursor.create(),WaveSurfer.regions.create()]
  })

  this.wavesurfer.load(this.audioPath)

  // run function passed to codekeyframes on init
  this.wavesurfer.on('pause', () => {
 		this.onPause()
  })

	// run function passed to codekeyframes on init
  this.wavesurfer.on('play', () => {
 		this.onPlay()
  })

  this.wavesurfer.on('ready', (e) =>{
 
 		// reset zoom level
    this.wavesurfer.zoom(this.zoom)

    // load regions from localstorage and keyframes
    this.loadRegions()

    // build the sequence
    this.updateSequence()

    // populate the state panel
    this.updateStatePanel()

    // run initial onFrame function once
    this.onFrame()

    // autoplay
    if(this.autoplay){
      this.wavesurfer.play()
    }

    this.onCanPlay()
  })

  this.wavesurfer.on('region-click', (region) => {
  	this.activateRegion(region)
    this.updateSequence()
  })

  this.wavesurfer.on('seek', () => {
    this.updateSequence()
  })

  this.wavesurfer.on('audioprocess', () => {

  	this.onFrame()

    var time    = this.wavesurfer.getCurrentTime()
    var command = this.sequence[this.sequenceCursor]
    if( !command ) return
    if( time > command.time ){
      this.sequenceCursor++      

      // find the region to show
      var regions = this.wavesurfer.regions.list
      for( var key in regions){
        if( regions[key].start == command.time ){
          this.activateRegion(regions[key], false)
          break
        }
      }

    }
  })

}