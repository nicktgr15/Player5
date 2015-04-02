var myPlayer5;

$(document).ready(function(){
    myPlayer5 = new Player5();
});

function Player5(){
    this.player5DomEl = $('#player5');
    this.videoDomEl = $('#player5 video');
    this.player = this.videoDomEl[0];
    this.fullScreen = false;
    this.lastVolume = 1.0;
    this.sources = {};
    this.selectedSourceType = null;
    this.selectedSource = null;

    this.lastCurrentTime = 0;
    this.lastPaused = true;

    this._addControls();

    this.waveformSVG = null;
    this.paper = null;
    this.audio_samples = null;

    var self = this;

    this.videoDomEl.on("play", function(){
        self.playButtonDomEl.html(self.pauseButtonSVG);
    });

    this.videoDomEl.on("pause", function(){
        self.playButtonDomEl.html(self.playButtonSVG);
    });

    this.videoDomEl.on("timeupdate", function(){
        self.startTimeDomEl.html(self._calculatePrettyTime(self.player.currentTime));
        self._updateProgressBar();
        self._updateWaveformProgressBar();
    });

    this.videoDomEl.click(function(){
        if(self.player.paused){
            self.player.play();
        } else {
            self.player.pause();
        }
    });

    this.videoDomEl.on("loadeddata", function(){
    });

    this.videoDomEl.on("loadedmetadata", function(){
        self.endTimeDomEl.html(self._calculatePrettyTime(self.player.duration));
        self._updateVolumeBar();

        // Load sources
        if(self.selectedSourceType == null){

            self._getAudioSamples();

            self._getSources();
            var sourcesQualities = '';
            for(var i=0;i<self.sources[self.selectedSourceType].length;i++){
                if(i==0){
                    sourcesQualities+='<span class="selected-source" src="'+self.sources[self.selectedSourceType][i]['src']+'">'+self.sources[self.selectedSourceType][i]['source-quality-id']+'</span>';
                } else {
                    sourcesQualities+='<span class="set-source" src="'+self.sources[self.selectedSourceType][i]['src']+'">'+self.sources[self.selectedSourceType][i]['source-quality-id']+'</span>';
                }
            }
            self.menuPopupQualitiesListDomEl.html(sourcesQualities);

            $('#player5 span').click(function(){
                if($(this).hasClass('set-source')){
                    var srcUrl = $(this).attr('src');
                    $('#player5 #menu-popup .selected-source').addClass('set-source');
                    $('#player5 #menu-popup .selected-source').removeClass('selected-source');
                    $(this).addClass('selected-source');
                    $(this).removeClass('set-source');

                    self.lastPaused = self.player.paused;
                    self.lastCurrentTime = self.player.currentTime;
                    self.menuPopupDomEl.hide();

                    self.player.src = srcUrl;
                }
            });
        }

        if(!self.lastPaused){
            self.player.play();
        }
        self.player.currentTime = self.lastCurrentTime;

    });

    this.videoDomEl.on("volumechange", function(){
        self._updateVolumeBar();
    });

    this.volumeBarContainerDomEl.click(function(e){
        var x = e.offsetX;
        self.player.volume = e.offsetX / self.volumeBarContainerDomEl.width();
    });

    var fullScreenChangeHandler = function(){
        self.fullScreen = !self.fullScreen;
        self._updateProgressBar();
        self._updateWaveformProgressBar();
        self._generateWaveform();
    };

    document.addEventListener("webkitfullscreenchange", fullScreenChangeHandler);
    document.addEventListener("fullscreenchange", fullScreenChangeHandler);
    document.addEventListener("mozfullscreenchange", fullScreenChangeHandler);
    document.addEventListener("msfullscreenchange", fullScreenChangeHandler);

    this.playButtonDomEl.click(function(){
        if(self.player.paused){
            self.player.play();
        } else {
            self.player.pause();
        }
    });

    this.fullScreenButtonDomEl.click(function(){
        self._setFullScreen();
    });

    this.volumeIcon.click(function(){
        if(self.player.volume == 0.0){
            self.player.volume = self.lastVolume;
        } else {
            self.lastVolume = self.player.volume;
            self.player.volume = 0;
        }
    });

    this.progressBarDomEl.click(function(e){
        var x_pixels = (e.offsetX || e.clientX - $(e.target).offset().left); //firefox workaround
        var time = self._getTimeFromPixels(x_pixels, self.player.duration, self.progressBarDomEl.width());
        self.player.currentTime = time;
    });

    this.progressBarDomEl.mouseover(function(e){
        self.currentTimePopupDomEl.show();
    });

    this.progressBarDomEl.mousemove(function(e){

        e.offsetX = (e.offsetX || e.clientX - $(e.target).offset().left); //firefox workaround

        if(e.offsetX - 5 < self.currentTimePopupDomEl.width()/2){
            self.currentTimePopupDomEl.css('left', 5);
        } else if(e.offsetX > self.progressBarDomEl.width()-self.currentTimePopupDomEl.width()/2 -5){
            self.currentTimePopupDomEl.css('left', self.progressBarDomEl.width() - self.currentTimePopupDomEl.width() -5);
        }
        else self.currentTimePopupDomEl.css('left', e.offsetX - self.currentTimePopupDomEl.width()/2);
        var timeInSeconds = self._getTimeFromPixels(e.offsetX, self.player.duration, self.progressBarDomEl.width());
        self.currentTimePopupDomEl.html(self._calculatePrettyTime(timeInSeconds));
    });

    this.progressBarDomEl.mouseout(function(e){
        self.currentTimePopupDomEl.hide();
    });

    this.menuButtonDomEl.click(function(){
        if(self.menuPopupDomEl.is(":visible")){
            self.menuPopupDomEl.hide();
        } else {
            self.menuPopupDomEl.show();
        }
    });
}


Player5.prototype._getAudioSamples = function(){
    var audioSamplesUrl = this.player5DomEl.attr('audio_samples_url');
    self = this;
    $.get(audioSamplesUrl, function(data){
        self.audio_samples = data;
        self.paper = Raphael(document.getElementById('paper'), "100%", 40);
        self._generateWaveform();
    });
};

Player5.prototype._generateWaveform = function(){

    if(this.waveformSVG != null){
        this.waveformSVG.remove();
    }

    waveformPath = "M0,20";

    for(var i=0;i<this.audio_samples.y.length;i++){
        waveformPath += 'L'+this.audio_samples.x[i]+','+(this.audio_samples.y[i])*40
    }
    this.waveformSVG = this.paper.path(waveformPath);
    this.waveformSVG.attr("stroke", "#eee");

    if(this.fullScreen){
        this.waveformSVG.transform('s' + screen.width/(this.audio_samples.y.length/2) + ",1,0,0");
    } else {
        this.waveformSVG.transform('s' + this.waveformBarDomEl.width()/(this.audio_samples.y.length/2) + ",1,0,0");
    }


};


/*
 source = {
 "video/mp4": [
 { "source-quality-id": "360p", "src": "videourl1" },
 { "source-quality-id": "480p", "src": "videourl2" }
 ],
 "video/webm": [
 { "source-quality-id": "360p", "src": "videourl1" },
 { "source-quality-id": "480p", "src": "videourl2" }
 ]
 }
 */

Player5.prototype._getSources = function(){
    var videoSources = this.player5DomEl.find('source');

    var self = this;

    videoSources.each(function(){
        var sourceQualityId = $(this).attr('source-quality-id');
        var sourceUrl = $(this).attr('src');
        var sourceType = $(this).attr('type');

        // Check if browser supports the source type
        if(self.player.canPlayType(sourceType) != ""){

            if(self.selectedSourceType == null){
                self.selectedSourceType = sourceType;
            }

            //Check if the dictionary has an entry for that source type
            if(!(sourceType in self.sources)){
                self.sources[sourceType] = [];
            }

            self.sources[sourceType].push({"source-quality-id": sourceQualityId, "src": sourceUrl});
        }
    });
};

Player5.prototype._calculatePrettyTime = function(seconds){
    var hours = (Math.floor(seconds / 3600)).toString();
    if(hours.length == 1){
        hours = "0"+hours;
    }
    var minutes = (Math.floor((seconds - hours*3600) / 60)).toString();
    if(minutes.length == 1){
        minutes = "0"+minutes;
    }
    var seconds = (Math.floor(seconds % 60)).toString();
    if(seconds.length == 1){
        seconds = "0"+seconds;
    }
    return hours + ":" + minutes + ":" +seconds;
};

Player5.prototype._updateVolumeBar = function(){
    var width = this.player.volume * this.volumeBarContainerDomEl.width();
    this.volumeBarDomEl.width(width);
    if(this.player.volume == 0.0){
        this.volumeIcon.html(this.muteSVG);
    } else if(this.player.volume <= 0.33){
        this.volumeIcon.html(this.lowVolumeSVG);
    } else if(this.player.volume > 0.33 && this.player.volume <= 0.66){
        this.volumeIcon.html(this.mediumVolumeSVG);
    } else if(this.player.volume > 0.66 && this.player.volume <= 1.0){
        this.volumeIcon.html(this.highVolumeSVG);
    }
};

Player5.prototype._updateProgressBar = function(){
    var width = this._getPixelsFromTime(this.player.currentTime, this.player.duration, this.progressBarDomEl.width());
    this.progressDomEl.width(width);
};

Player5.prototype._updateWaveformProgressBar = function(){
    var width = this._getPixelsFromTime(this.player.currentTime, this.player.duration, this.waveformBarDomEl.width());
    this.waveformProgressDomEl.width(width);
};

Player5.prototype._getTimeFromPixels = function(pixels, duration, lengthInPixels) {
    return (duration * pixels) / lengthInPixels;
};

Player5.prototype._getPixelsFromTime = function(seconds, duration, lengthInPixels){
    return (seconds * lengthInPixels) / duration;
};

Player5.prototype._setFullScreen = function(){

    var elem = this.player5DomEl[0];

    if(!this.fullScreen) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
};

Player5.prototype._addControls = function(){
    this.player5DomEl.append('<div id="controls"></div>');
    this.controlsDomEl = $('#player5 #controls');

    this.controlsDomEl.append('<div id="progress-bar"></div>');
    this.progressBarDomEl = $('#progress-bar');
    this.progressBarDomEl.append('<div id="progress"></div>');
    this.progressDomEl = $('#progress');

    this.progressBarDomEl.append('<div id="current-time-popup"></div>');
    this.currentTimePopupDomEl = $('#current-time-popup');
    this.currentTimePopupDomEl.html('00:00:00');

    this.controlsDomEl.append('<div id="waveform-bar"></div>');
    this.waveformBarDomEl = $('#waveform-bar');
    this.waveformBarDomEl.append('<div id="waveform-progress"></div>');
    this.waveformProgressDomEl = $('#waveform-progress');
    this.waveformBarDomEl.append('<div id="paper"></div>');

    this.controlsDomEl.append('<div id="controls-bar"></div>');
    this.controlsBarDomEl = $('#player5 #controls-bar')

    this.playButtonSVG = '<svg width="50" height="35"><path transform="translate(15,6) scale(0.35,0.35)" d="M12 8l40 24-40 24z" fill="#ccc"></path></svg>';
    this.pauseButtonSVG = '<svg width="50" height="35"><path transform="translate(15,6) scale(0.35,0.35)" d="M8 8h20v48h-20zM36 8h20v48h-20z" fill="#ccc"></path></svg>';
    this.fullScreenSVG = '<svg width="50" height="35"><path transform="translate(17,9) scale(0.25,0.25)" d="M64 0v26l-10-10-12 12-6-6 12-12-10-10zM28 42l-12 12 10 10h-26v-26l10 10 12-12z" fill="#ccc"></path></svg>';
    this.muteSVG = '<svg width="50" height="35"><path transform="translate(17,9) scale(0.28,0.28)" d="M60 38.697v5.303h-5.303l-6.697-6.697-6.697 6.697h-5.303v-5.303l6.697-6.697-6.697-6.697v-5.303h5.303l6.697 6.697 6.697-6.697h5.303v5.303l-6.697 6.697 6.697 6.697z" fill="#ccc">' +
        '</path><path transform="translate(17,9) scale(0.28,0.28)" d="M26 60c-0.52 0-1.032-0.203-1.415-0.586l-15.414-15.414h-7.172c-1.105 0-2-0.895-2-2v-20c0-1.105 0.895-2 2-2h7.172l15.414-15.414c0.572-0.572 1.432-0.743 2.18-0.434s1.235 1.039 1.235 1.848v52c0 0.809-0.487 1.538-1.235 1.848-0.247 0.102-0.507 0.152-0.765 0.152z" fill="#ccc"></path></svg>';
    this.lowVolumeSVG = '<svg width="50" height="35"><path transform="translate(17,9) scale(0.28,0.28)" d="M26 60c-0.52 0-1.032-0.203-1.415-0.586l-15.414-15.414h-7.172c-1.105 0-2-0.895-2-2v-20c0-1.105 0.895-2 2-2h7.172l15.414-15.414c0.572-0.572 1.432-0.743 2.18-0.434s1.235 1.039 1.235 1.848v52c0 0.809-0.487 1.538-1.235 1.848-0.247 0.102-0.507 0.152-0.765 0.152z" fill="#ccc"></path></svg>';
    this.mediumVolumeSVG = '<svg width="50" height="35"><path transform="translate(17,9) scale(0.28,0.28)" d="M34.314 46.314c-0.768 0-1.535-0.293-2.121-0.879-1.172-1.172-1.172-3.071 0-4.242 5.069-5.069 5.069-13.316 0-18.385-1.172-1.172-1.172-3.071 0-4.243s3.071-1.172 4.243 0c7.408 7.408 7.408 19.462 0 26.87-0.586 0.586-1.353 0.878-2.121 0.878z" fill="#ccc"></path><path transform="translate(17,9) scale(0.28,0.28)" d="M26 60c-0.52 0-1.032-0.203-1.415-0.586l-15.414-15.414h-7.172c-1.105 0-2-0.895-2-2v-20c0-1.105 0.895-2 2-2h7.172l15.414-15.414c0.572-0.572 1.432-0.743 2.18-0.434s1.235 1.039 1.235 1.848v52c0 0.809-0.487 1.538-1.235 1.848-0.247 0.102-0.507 0.152-0.765 0.152z" fill="#ccc"></path></svg>';
    this.highVolumeSVG = '<svg width="50" height="35"><path transform="translate(17,9) scale(0.28,0.28)" d="M44.971 51.971c-0.768 0-1.535-0.293-2.121-0.879-1.172-1.172-1.172-3.071 0-4.243 8.188-8.188 8.188-21.511 0-29.698-1.172-1.172-1.172-3.071 0-4.243s3.071-1.171 4.243 0c5.1 5.099 7.908 11.88 7.908 19.092s-2.809 13.992-7.908 19.092c-0.586 0.586-1.353 0.879-2.121 0.879v0zM34.314 46.314c-0.768 0-1.535-0.293-2.121-0.879-1.172-1.172-1.172-3.071 0-4.242 5.069-5.069 5.069-13.316 0-18.385-1.172-1.172-1.172-3.071 0-4.243s3.071-1.172 4.243 0c7.408 7.408 7.408 19.462 0 26.87-0.586 0.586-1.353 0.878-2.121 0.878z" fill="#ccc"></path>' +
        '<path transform="translate(17,9) scale(0.28,0.28)" d="M26 60c-0.52 0-1.032-0.203-1.415-0.586l-15.414-15.414h-7.172c-1.105 0-2-0.895-2-2v-20c0-1.105 0.895-2 2-2h7.172l15.414-15.414c0.572-0.572 1.432-0.743 2.18-0.434s1.235 1.039 1.235 1.848v52c0 0.809-0.487 1.538-1.235 1.848-0.247 0.102-0.507 0.152-0.765 0.152z" fill="#ccc"></path></svg>'
    this.menuSVG = '<svg width="50" height="35"><path transform="translate(15,6) scale(0.35,0.35)" d="M4 12h56v12h-56zM4 28h56v12h-56zM4 44h56v12h-56z" fill="#ccc"></path></svg>';


    this.controlsBarDomEl.append('<div id="play-button" class="player5-button control-bar-el">'+this.playButtonSVG+'</div>');

    this.controlsBarDomEl.append('<div id="time" class="control-bar-el"><span id="start-time">00:00:00</span> / <span id="end-time">00:00:00</span></div>');
    this.startTimeDomEl = $('#player5 #start-time');
    this.endTimeDomEl = $('#player5 #end-time');

    this.controlsBarDomEl.append('<div id="volume-icon" class="player5-button control-bar-el">'+this.muteSVG+'</div>');
    this.volumeIcon = $('#volume-icon');
    this.controlsBarDomEl.append('<div id="volume-bar-container" class="control-bar-el"></div>');

    this.volumeBarContainerDomEl = $('#volume-bar-container');
    this.volumeBarContainerDomEl.append('<div id="volume-bar-click-area"></div>');
    this.volumeBarClickAreaDomEl = $('#player5 #volume-bar-click-area');
    this.volumeBarClickAreaDomEl.append('<div id="volume-bar"></div>');
    this.volumeBarDomEl = $('#player5 #volume-bar');

    this.controlsBarDomEl.append('<div id="fullscreen-button" class="player5-button">'+this.fullScreenSVG+'</div>');
    this.fullScreenButtonDomEl =  $('#player5 #fullscreen-button');

    this.controlsBarDomEl.append('<div id="menu-button" class="player5-button">'+this.menuSVG+'</div>');
    this.menuButtonDomEl = $('#player5 #menu-button');
    this.controlsBarDomEl.append('<div id="menu-popup"><table><tr><td>Quality: </td><td id="qualities-list"></td></tr></table></div></div>');
    this.menuPopupDomEl = $('#player5 #menu-popup');
    this.menuPopupQualitiesListDomEl = $('#player5 #qualities-list');


    this.playButtonDomEl = $('#player5 #play-button');
};