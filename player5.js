var myPlayer5;

$(document).ready(function(){
    myPlayer5 = new Player5();
});

function Player5(){
    this.player5DomEl = $('#player5');
    this.videoDomEl = $('#player5 video');
    this.player = this.videoDomEl[0];
    this.fullScreen = false;

    this._addControls();

    var self = this;

    this.videoDomEl.on("play", function(){
        self.playButtonDomEl.html(self.pauseButtonSVG);
    });

    this.videoDomEl.on("pause", function(){
        self.playButtonDomEl.html(self.playButtonSVG);
    });

    this.videoDomEl.on("timeupdate", function(){
        self.startTimeDomEl.html(self._calculatePrettyTime(self.player.currentTime));
    });

    this.videoDomEl.on("loadedmetadata", function(){
        self.endTimeDomEl.html(self._calculatePrettyTime(self.player.duration));
    });

    var fullScreenChangeHandler = function(){
        self.fullScreen = !self.fullScreen;
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
}

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
    this.controlsDomEl.append('<div id="controls-bar"></div>');
    this.controlsBarDomEl = $('#player5 #controls-bar')

    this.playButtonSVG = '<svg width="50" height="35"><path transform="translate(15,6) scale(0.35,0.35)" d="M12 8l40 24-40 24z" fill="#ccc"></path></svg>';
    this.pauseButtonSVG = '<svg width="50" height="35"><path transform="translate(15,6) scale(0.35,0.35)" d="M8 8h20v48h-20zM36 8h20v48h-20z" fill="#ccc"></path></svg>';
    this.fullScreenSVG = '<svg width="50" height="35"><path transform="translate(17,9) scale(0.25,0.25)" d="M64 0v26l-10-10-12 12-6-6 12-12-10-10zM28 42l-12 12 10 10h-26v-26l10 10 12-12z" fill="#ccc"></path></svg>';

    this.controlsBarDomEl.append('<div id="play-button" class="player5-button control-bar-el">'+this.playButtonSVG+'</div>');

    this.controlsBarDomEl.append('<div id="time" class="control-bar-el"><span id="start-time">00:00:00</span> / <span id="end-time">00:00:00</span></div>');
    this.startTimeDomEl = $('#player5 #start-time');
    this.endTimeDomEl = $('#player5 #end-time');

    this.controlsBarDomEl.append('<div id="fullscreen-button" class="player5-button">'+this.fullScreenSVG+'</div>');
    this.fullScreenButtonDomEl =  $('#player5 #fullscreen-button');

    this.playButtonDomEl = $('#player5 #play-button');
};