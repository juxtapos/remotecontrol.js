function Scenario1 (rch) {
    var self = this;
    this.container = null;

    function init (container) {
        for (var i = 20; i--;) {
            $(container).append('<div class="box">&nbsp;</div>');
        }
        self.container = container;

        var mouseStartDelta, currentCursorTarget, cursorId = 'rcjscursor', cursor, cursorElmt;
        cursorElmnt = $('<div class="rcjscursor" id="' + cursorId + '"></div>').appendTo(container);

        function up (event) {
            mouseStartDelta = null;
            cursorElmnt.addClass('off');
        }

        function down (event) {
            cursorElmnt.show();
            cursorElmnt.removeClass('off');
            var curpos = cursorElmnt.position();
            mouseStartDelta = { x: event.clientX - curpos.left, y: event.clientY - curpos.top };
        }

        function move (event) {
            var x, y, target;
            if (mouseStartDelta) {
                cursorElmnt.css( { 
                    left: event.clientX - mouseStartDelta.x + 'px', 
                    top: event.clientY - mouseStartDelta.y + 'px' 
                } );
                // Hide the cursor before getting elementFromPoint, so we don't get the cursor itself.
                cursorElmnt.toggle();
                if ( ( target = document.elementFromPoint(event.clientX - mouseStartDelta.x + container.offset().left, 
                        event.clientY - mouseStartDelta.y) ) ) {
                    cursorElmnt.toggle();   
                    $(target).addClass('focused');
                    if (currentCursorTarget && currentCursorTarget != target) {
                        $(currentCursorTarget).removeClass('focused');
                        
                    }
                    currentCursorTarget = target;
                } else {
                    cursorElmnt.toggle();   
                }
            }
        }

        rch.addEventListener('rcjs:singletouchstart', down);
        rch.addEventListener('rcjs:singletouchmove', move);
        rch.addEventListener('rcjs:singletouchend', up);
        
    }

    function run () {

    }

    function destroy () {

    }

    return {
        init: init,
        run: run,
        destroy: destroy
    }
}
Scenario1.title = 'Touch Selection';
Scenario1.description = 'A single-finger touch move on the remote device is used to create a \
pointer function on the host application.\n\nSingle-finger touches are easily captured by listening \
for rcjs:singletouchstart, rcjs:singletouchmove and rcjs:singletouchend events.';





function Scenario2 (rch) {

    function init (container) {
        for (var i = 10; i--;) {
            container.append('<div class="box">&nbsp;</div>');
        }

        var e = $('<canvas width="1000" height="1000"/>').appendTo(container);
        var ctx = e.get()[0].getContext("2d");

        for (var i = 180; i > -180; i--) {
            var rad = i * (Math.PI / 180);
            ctx.beginPath();
            ctx.strokeStyle = 'hsla('+i+', 100%, 50%, 0.1)';
            ctx.lineWidth = 20;
            ctx.moveTo(200 + Math.sin(rad) * 120 , 200 + Math.cos(rad) * 100);
            ctx.lineTo(200, 200);
            ctx.stroke();
            ctx.closePath();
            ctx.clearRect(130, 160, 140, 80);

        }    

        var target;
        $(container).find('#stage .box').click(function (event) {
            if (target) {
                $(target).removeClass('focused');    
            }
            $(event.target).addClass('focused');
            target = event.target;
        });

        rch.addEventListener('rcjs:swipe', function (event) {
            e.css({
                display: 'block',
                top: $(target).position().top,
                left: $(target).position().left
            });
            $(target).css('background-color' , 'hsl(' + event.angle + ', 100%, 50%)');
        });

        rch.addEventListener('rcjs:swipeend', function (event) {
            var dir = rch.getDirection(event.angle);
            $(target).css('background-color' , 'hsl(' + event.angle + ', 100%, 50%)');

        });
    }

    function run () {

    }

    function destroy () {

    }

    return {
        init: init,
        run: run,
        destroy: destroy 
    }
}
Scenario2.title = 'Mouse Clicks & Context Swipes';
Scenario2.description = 'combined mouse click and touch select';


function Scenario3 (rch) {

    var selectedPhoto;

    function init (container) {
        var stage = container;
        var url = 'https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=graffiti nyc&rsz=8&callback=?';
        $.getJSON(url, function (data) {
            data.responseData.results.forEach(function (result, index) {
                var photo = $('<div class="photo" id="photo' 
                    + index + '"><img src="' + result.url+ '"></div>').appendTo(stage);
                $(photo).find('img').on('load', function () {
                    var img = $(this);
                    photo.css('-webkit-transform', ' rotate(' + (Math.random() * 90 - 45) + 'deg)');
                    photo.css({
                        top: Math.max(Math.random() * stage.height() - photo.height(), 0) + "px",
                        left: Math.max(Math.random() * stage.width() - photo.width(), 0) + "px",
                    });
                    photo.click(function () {
                        $(selectedPhoto).removeClass('selected');
                        $(this).addClass('selected');
                        selectedPhoto = this;
                    });
                    
                });
                photo.draggable();
            });
        });

        rch.addEventListener('rcjs:pinch', function (event) {
            //var dir = rch.getDirection(event.angle);
            var rotation = event.rotation;
            var deg = rotation < 0 ? 180 + (rotation * -1) : rotation;
            console.log('pinch ' + deg);
            $(selectedPhoto).css('-webkit-transform', 'rotate(' + deg + 'deg)');
        });

    }


    function run () {

    }

    function destroy () {

    }

    return {
        init: init,
        run: run,
        destroy: destroy
    }
}
Scenario3.title = 'Photos';
Scenario3.description = 'Photos can be dragged with the mouse, selected with a click and then\
rotated and scaled with a rotate and pinch gestures on the remote device.\n\nRotate and pinch\
events are distinguished and have three types each, e.g. rcjs:rotationstart, rcjs:pinchmove.';

function Scenario4 (rch) {

    function init (container) {
        
        rch.addEventListener('rcjs:pinch', function (event) {
            console.log('pinching ' + event.rotation);
        });
        // rch.addEventListener('deviceorientation', function (event) {
        //     console.log(event)
        // });

        // rch.addEventListener('devicemotion', function (event) {
        //     if (event.acceleration.x > 0.1)
        //     console.log(event.acceleration.x);
        // });
    }

    function run () {

    }

    function destroy () {

    }

    return {
        init: init,
        run: run,
        destroy: destroy
    }
}
Scenario4.title = 'Rotate Things';
Scenario4.description = 'Control with device orientation';