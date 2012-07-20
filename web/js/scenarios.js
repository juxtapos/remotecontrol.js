function Scenario1 (rch) {
    var self = this;
    this.container = null;

    function init (container) {
        for (var i = 20; i--;) {
            var l = 50,
                s = Math.round(Math.random() * 50) + 50;
            $('<div class="box">&nbsp;</div>').appendTo(container).css('background-color', 'hsl(57, ' + s + '%, ' + l + '%)')
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
            cursorElmnt.css( { 
                    left: event.clientX - mouseStartDelta.x + 'px', 
                    top: event.clientY - mouseStartDelta.y + 'px' 
                } );
        }

        function move (event) {
            //console.log('move')
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

    function destroy () {

    }

    return {
        init: init,
        destroy: destroy
    }
}
Scenario1.title = 'Touch Selection';
Scenario1.description = 'A single-finger touch move on the remote device is used to create a \
    pointer function on the host application.';

function Scenario2 (rch) {

    function init (container) {
        var target; 

        for (var i = 0; ++i < 11;) {
            container.append('<div class="box">Message #' + i + '</div>');
        }

        // var e = $('<canvas width="1000" height="1000"/>').appendTo(container);
        // var ctx = e.get()[0].getContext("2d");
        // for (var i = 180; i > -180; i--) {
        //     var rad = i * (Math.PI / 180);
        //     ctx.beginPath();
        //     ctx.strokeStyle = 'hsla('+i+', 100%, 50%, 0.9)';
        //     ctx.lineWidth = 3;
        //     ctx.moveTo(200 + Math.sin(rad) * 120 , 200 + Math.cos(rad) * 120);
        //     ctx.lineTo(200 + Math.sin(rad) * 40 , 200 + Math.cos(rad) * 40);
        //     ctx.stroke();
        //     ctx.closePath();
        //     //ctx.clearRect(130, 160, 140, 80);
        // }    
        // e.hide();

        function clickHandler (event) {
            if (target) {
                target.removeClass('selected');    
            }
            target = $(event.target);
            target.addClass('selected');

            return false;
        }
        
        $(container).sortable();
        $(container).find('.box').click(clickHandler);

        $(container).click(function (event) {
            $(target).removeClass('selected');    
        });

        rch.addEventListener('rcjs:pinch', function (event) {
            $(target).css('background-color' , 'hsl(' + event.rotation + ', 100%, 50%)');
        });

        rch.addEventListener('rcjs:swipeend', function (event) {
            if (target) {
                var dir = rch.getDirection(event.angle);
                switch (dir) {
                    case 's':
                        var clone = target.clone().click(clickHandler).removeClass('selected');
                        var content = 'Copy of ' + clone.html();
                        target.after(clone.empty().append(content));    
                        break;
                    case 'n':
                        target.remove();
                        break;
                    case 'w':
                        target.addClass('double');
                        break;
                    case 'e':
                        target.removeClass('double');
                        break;
                        
                }     
            }
        });
    }

    function destroy () {

    }

    return {
        init: init,
        destroy: destroy 
    }
}
Scenario2.title = 'Context Swipes';
Scenario2.description = 'Combined mouse click selection and swipes: select a box with your mouse \
then copy it with a "south-swipe, delete it with a "north-swipe", and double/reset the width with \
"east-/west-swipes". The color can be changed by using a 2-finger rotation gesture.';

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
                    var rotation = (Math.random() * 90 - 45),
                        scale = Math.random() / 2 + 0.5;
                    photo.data({
                        rotation: rotation,
                        scale: scale
                    })
                    .css('-webkit-transform', 'rotate(' + rotation + 'deg) scale(' + scale + ')')
                    .css('-moz-transform', ' rotate(' + rotation + 'deg)')
                    .css({
                        top: Math.max(Math.random() * stage.height() - photo.height(), 0) + "px",
                        left: Math.max(Math.random() * stage.width() - photo.width(), 0) + "px"
                    }).mousedown(function () {
                        $(selectedPhoto).removeClass('selected');
                        $(this).addClass('selected');
                        selectedPhoto = this;
                    }).click(function () {
                        $(selectedPhoto).removeClass('selected');
                        $(this).addClass('selected');
                        selectedPhoto = this;
                    }).mouseup(function () {
                        $(selectedPhoto).removeClass('selected');
                        selectedPhoto = null;
                    });
                });
                photo.draggable();
            });
        });

        rch.addEventListener('rcjs:pinchend', function (event) {
            $(selectedPhoto).data({
                scale: $(selectedPhoto).data('currentScale'), 
                currentScale: null, 
                rotation: $(selectedPhoto).data('currentRotation'),
                currentRotation: null
            });
        });

        rch.addEventListener('rcjs:pinch', function (event) {
            var scale = $(selectedPhoto).data('scale') * event.scale,
                deg = event.rotation + $(selectedPhoto).data('rotation');
            $(selectedPhoto).data({
                currentScale: scale,
                currentRotation: deg
            })
            .css('-webkit-transform', 'rotate(' + deg + 'deg) scale(' + scale + ')')
            .css('-moz-transform', 'rotate(' + deg + 'deg) scale(' + scale + ')');
        });

    }

    function destroy () {

    }

    return {
        init: init,
        destroy: destroy
    }
}
Scenario3.title = 'Photos';
Scenario3.description = 'Photos can be dragged with the mouse, selected with a click and then\
    rotated and scaled with a rotate and pinch gestures on the remote device.\n\n\
    The photos come from live a Google search. ';

function Scenario4 (rch) {

    var selected = 10;

    function init (container) {
        container.append('Todo');
        // rch.addEventListener('deviceorientation', function (event) {
        //     console.log(event.alpha + ', ' + event.beta + ', ' + event.gamma);
        // });

        // rch.addEventListener('devicemotion', function (event) {
        //     var threshold = 0.5;

        //     var left = event.acceleration.x < -threshold;
        //     var right = event.acceleration.x > threshold;
        //     var up = event.acceleration.z < -threshold;
        //     var down = event.acceleration.z > threshold;
        //     var back = event.acceleration.y < -threshold;
        //     var forward = event.acceleration.y > threshold;

        //     console.log(left ? 'left ' : '');

        //     //console.log(back+","+forward)

        //     // console.log(event.acceleration.x + ',' + event.acceleration.y + ',' + event.acceleration.z);   
        //     $('#C' + selected).removeClass('high');
        //     if (up) {
        //         selected += 1;
        //     } else if (down) {
        //         selected -= 1;
        //     }
        //     $('#C' + selected).addClass('high');
        // });

        // $('#C' + selected).addClass('high');
    }

    function destroy () {

    }

    return {
        init: init,
        destroy: destroy
    }
}
Scenario4.title = 'Rotate Things';
Scenario4.description = 'Control with device orientation';

function Scenario5 (rch) {

    var selected = 10;

    function init (container) {

        $(container).append('<table>\
            <tr>\
                <th>Gesture</th>\
                <td id="Gesture"></td>\
            </tr>\
            <tr>\
                <td>Event type</td>\
                <td id="EventType"></td>\
            </tr>\
            <tr>\
                <td>Values</th>\
                <td id="Values"></td>\
            </tr>\
            </table>');

        rch.addEventListener('rcjs:pinchstart', function (event) {
            print('pinch', 'rcjs:pinchstart', event);
        });

        rch.addEventListener('rcjs:pinch', function (event) {
            print('pinch', 'rcjs:pinch', event);
        });

        rch.addEventListener('rcjs:pinchend', function (event) {
            print('', 'rcjs:pinchend', event);
        });

        rch.addEventListener('rcjs:swipestart', function (event) {
            print('swipe', 'rcjs:swipestart', event);
        });

        rch.addEventListener('rcjs:swipe', function (event) {
            print('swipe', 'rcjs:swipe', event);
        });

        rch.addEventListener('rcjs:swipeend', function (event) {
            print('', 'rcjs:swipeend', event);
        });

        function print (gesture, type, obj) {
            $('#Gesture').empty().append(gesture);
            $('#EventType').empty().append(type);
            $('#Values').empty().append(JSON.stringify(obj, null, '\t'));
        }
    }

    function destroy () {

    }

    return {
        init: init,
        destroy: destroy
    }
}
Scenario5.title = 'Low-level';
Scenario5.description = 'Testing tap, touchmove, swipe, pinch & rotate gestures.\n\n\
    Currently implemented are touchmove, swipe, pinch & rotate. Taps are coming.';