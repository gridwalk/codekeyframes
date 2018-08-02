function CodeKeyframes(args){

  if( !args.audioPath ) return

  this.audioPath  = args.audioPath
  this.editorOpen = args.editorOpen || false
  this.keyframes  = args.keyframes  || []
  this.label      = args.label
  this.autoplay   = args.autoplay   || false

  this.activeRegion = null
  this.skipLength   = 1
  this.zoom         = 30
  this.nudging      = false
  this.nudgeMult    = 1

  this.sequence         = []
  this.sequenceCursor   = 0
  this.sequenceNextTime = null
  
  document.querySelector('body').insertAdjacentHTML('beforeend',`
    <div id="ckf-editor">
      <div id="ckf-waveform" tabindex="0"></div>
      <form class="code-form">
        <textarea name="code" id="code" cols="30" rows="10"></textarea>
        <div class="controls">
          <a href="#" class="render">Export Keyframes</a>
        </div>
      </form>
    </div>`)

  this._editor       = document.querySelector('#ckf-editor')
  this._waveform     = document.querySelector('#ckf-editor #waveform')
  this._codeForm     = document.querySelector('#ckf-editor .code-form')
  this._code         = document.querySelector('#ckf-editor #code')
  this._renderButton = document.querySelector('#ckf-editor .render')

  if( this.label ){
    _label = document.createElement('div')
    _label.innerHTML = this.label
    _label.classList.add('ckf-label')
    this._editor.appendChild(_label)
  }

  if( !this.editorOpen ){
    this._editor.classList.add('closed')
    this._codeForm.remove()
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

  this._renderButton.onclick = (e) => {
    var keyframes = []
    var regions = this.wavesurfer.regions.list
    for( var key in this.wavesurfer.regions.list ){
      var region = this.wavesurfer.regions.list[key]
      keyframes.push({
        start:region.start,
        end:region.end,
        data:region.data
      })
    }

    this.activeRegion = null
    this._code.value = JSON.stringify(keyframes)
  }



  document.addEventListener('keydown', (e) => {

    console.log(e.which)

    var keycodes = {

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
        this.nudgeMult = this.nudgeMult * .985
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

        this.editCode(region)
        this.saveRegions()
        this.updateSequence()
      },

      // space
      32:()=>{
        this.wavesurfer.playPause()
        this._code.classList.remove('error')
      },

      // page up
      33:()=>{
        this.editCode( this.getNextRegion() )
      },

      // page down
      34:()=>{
        this.editCode( this.getPrevRegion() )
      },

      // left bracket
      219:()=>{
        this.editCode( this.getPrevRegion() )
      },

      // right bracket
      221:()=>{
        this.editCode( this.getNextRegion() )
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


    }

    if( keycodes[e.which] ){
      keycodes[e.which]()
    }

  })

  document.addEventListener('keyup', (e) =>{

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
          start: region.start,
          end:   region.end,
          data:  region.data
        }
      })
    )
  }

  this.loadRegions = function(regions){

    var keyframeRegions = this.keyframes

    var localRegions = []
    if( localStorage.regions ) {
      localRegions = JSON.parse(localStorage.regions)
    }

    // combne and deduplicate
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
        drag:   false,
        resize: false
      })
    })
  }

  this.updateSequence = () => {

    this.sequence = []

    var regions = this.wavesurfer.regions.list
    for( var key in regions ){    
      // convert regions to commands and add to sequence
      var command = {
        time: regions[key].start,
        code: regions[key].data.code
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

    nudgeAmount = .1 * this.nudgeMult
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

  this.editCode = function(region, seek = true) {

    if(!region) return

    // execute the keyframe code
    this.runRegionCode(region)

    if( !this.editorOpen ) return

    // remove active class from all regions
    _regions = this._editor.querySelectorAll('region')
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
  },

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
    waveHeight = 50
  }

  var waveColor     = args.waveColor || '#3AEAD2'
  var progressColor = args.progressColor || '#0c9fa7'

  this.wavesurfer = WaveSurfer.create({
      container:     '#ckf-waveform',
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

  this.wavesurfer.on('ready', (e) =>{
    this.wavesurfer.zoom(this.zoom)

    // load regions from localstorage and keyframes
    this.loadRegions()

    // build the sequence
    this.updateSequence()

    // autoplay
    if(this.autoplay){
      this.wavesurfer.play()
    }
  })

  this.wavesurfer.on('region-click', (region) => {
    this.editCode(region)
    this.updateSequence()
  })

  this.wavesurfer.on('seek', () => {
    this.updateSequence()
  })

  this.wavesurfer.on('audioprocess', () => {
    var time    = this.wavesurfer.getCurrentTime()
    var command = this.sequence[this.sequenceCursor]
    if( !command ) return
    if( time > command.time ){
      this.sequenceCursor++      

      // find the region to show
      var regions = this.wavesurfer.regions.list
      for( var key in regions){
        if( regions[key].start == command.time ){
          this.editCode(regions[key], false)
          break
        }
      }

    }
  })
}