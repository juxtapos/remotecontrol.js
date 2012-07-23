function ScenarioBase (rch) {
    this.listeners = [];
    this.rch = rch;
}
ScenarioBase.prototype.addEventListener = function (type, listener) {
    this.rch.addEventListener.call(this, type, listener);
    this.listeners.push( { type: type, listener: listener } );
}

ScenarioBase.prototype.destroy = function () {
    var self = this;
    this.listeners.forEach(function (lstnr) {
        self.rch.removeEventListener.call(self, lstnr.type, lstnr.listener);
    });
}





function ScenarioTouchSelect (rch) {
    ScenarioBase.apply(this, arguments);
    this.container = null;
    var self = this;

    this.init = function (container) {
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
            console.log('move')
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
        this.addEventListener('rcjs:touchmove', function ( ) {});
        this.addEventListener('rcjs:singletouchstart', down);
        this.addEventListener('rcjs:singletouchmove', move);
        this.addEventListener('rcjs:singletouchend', up);
    }
}
ScenarioTouchSelect.prototype = new ScenarioBase();

function ScenarioContextGestures (rch) {
    ScenarioBase.apply(this, arguments);

    this.init = function (container) {
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
        
        $(container).find('.box').click(clickHandler);

        $(container).click(function (event) {
            $(target).removeClass('selected');    
        });

        this.addEventListener('rcjs:pinch', function (event) {
            $(target).css('background-color' , 'hsl(' + event.rotation + ', 100%, 50%)');
        });

        this.addEventListener('rcjs:swipeend', function (event) {
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
}
ScenarioContextGestures.prototype = new ScenarioBase();

function ScenarioPhotos (rch) {
    ScenarioBase.apply(this, arguments);
    var selectedPhoto;

    this.init = function (container) { 
        var query = 'graffiti dome',
            self = this;

        $(container).append('<div class="search"><label>Google Image Search</label><input id="SearchTerm"></div><div class="photos"></div>');
        $(container).find('#SearchTerm').attr('value', query)
            .keyup( function (event) {
                if (event.keyCode === 13) {
                    search($(this).attr('value'));
                    console.log('search')
                }
            } );
        search(query);

        function search (query) {
            var url = 'https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=' + query + '&rsz=8&callback=?';
            container.find('.photos').empty();
            $.getJSON(url, function (data) {
                data.responseData.results.forEach(function (result, index) {
                    var photo = $('<div class="photo" id="photo' 
                        + index + '"><img src="' + result.url+ '"></div>').appendTo(container.find('.photos'));    
                    var rotation = (Math.random() * 90 - 45),
                        scale = 0.4 + Math.random() * 0.2,
                        transform = 'rotate(' + rotation + 'deg)';
                    // Using a scale() transform causes all kind of problems when used with draggable,
                    // as the element's bounding box and thus its offset will be moved. This could 
                    // be fixed by applying the matrix operation the origins and apply the value to 
                    // the draggable's 'cursorAt' options property. 
                    var img = photo.find('img');
                    img.css('-webkit-transform', transform)
                        .css('-moz-transform', transform)
                        .attr('width', photo.find('img').width() * scale);
                    photo.css({
                            left: Math.random() * ($(container).width() - img.width() - 50),
                            top: Math.random() * ($(container).height() - img.height() - 50)
                        })
                        .draggable()
                        .mousedown(function () {
                            $(selectedPhoto).removeClass('selected');
                            $(this).addClass('selected');
                            selectedPhoto = this;
                        })
                        .data({
                            rotation: rotation,
                            scale: scale
                        });
                });

                container.click(function (event) {
                    if (event.target == this) {
                        $(selectedPhoto).removeClass('selected');
                        selectedPhoto = null;  
                    }
                });

                self.addEventListener('rcjs:pinchstart', function (event) {
                    $(selectedPhoto).data({
                        width: $(selectedPhoto).width()
                    });
                });

                self.addEventListener('rcjs:pinchend', function (event) {
                    $(selectedPhoto).data({
                        rotation: $(selectedPhoto).data('currentRotation'),
                    });
                });

                self.addEventListener('rcjs:pinch', function (event) {
                    var width = $(selectedPhoto).data('width') * event.scale,
                        deg = $(selectedPhoto).data('rotation') + event.rotation,
                        transform = 'rotate(' + deg + 'deg)';
                    $(selectedPhoto).find('img')
                        .css('-webkit-transform', transform)
                        .css('-moz-transform', transform)
                        .attr('width', width);
                });
            }); 
        }
    }
}
ScenarioPhotos.prototype = new ScenarioBase();

function ScenarioRotate (rch) {
    ScenarioBase.apply(this, arguments);
    var selected = 10;

    this.init = function (container) {
        container.append('Todo');
        // this.addEventListener('deviceorientation', function (event) {
        //     console.log(event.alpha + ', ' + event.beta + ', ' + event.gamma);
        // });

        // this.addEventListener('devicemotion', function (event) {
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
}
ScenarioRotate.prototype = new ScenarioBase();

function ScenarioLowLevel (rch) {
    ScenarioBase.apply(this, arguments);
    var selected = 10;

    this.init = function (container) {
        $(container).append('<h1>Low-level Event Test</h1>\
            <div class="left">\
                <table>\
                    <tr>\
                        <th>Current&nbsp;Gesture</th>\
                        <th id="Gesture">(none)</th>\
                    </tr>\
                    <tr>\
                        <td style="padding-top:20px">Last Event type</td>\
                        <td style="padding-top:20px;width:200px" id="EventType"></td>\
                    </tr>\
                    <tr>\
                        <td colspan="2" id="Values" style="vertical-align:top;padding-top:30px"></td>\
                    </tr>\
                </table>\
                <div style="margin-top:30px" id="EventList"></div>\
            </div>\
            <div class="right">\
                <div id="DeviceOrientationEvent"></div>\
                <div style="margin-top:30px" id="DeviceMotionEvent"></div>\
            </div>');

        this.addEventListener('rcjs:singletap', function (event) {
            print('Single-Tap', 'rcjs:singletap');
        });

        this.addEventListener('rcjs:doubletap', function (event) {
            print('Double-Tap', 'rcjs:doubletap');
        });

        this.addEventListener('rcjs:singletouchstart', function (event) {
            print('Start single-touch', 'rcjs:pinchstart', event);
        });

        this.addEventListener('rcjs:singletouchmove', function (event) {
            print('Single-touch move', 'rcjs:singletouchmove', event);
        });

        this.addEventListener('rcjs:singletouchend', function (event) {
            print('End single-touch', 'rcjs:singletouchend', event);
        });

        this.addEventListener('rcjs:pinchstart', function (event) {
            print('Start pinch', 'rcjs:pinchstart', event);
        });

        this.addEventListener('rcjs:pinch', function (event) {
            print('Pinching', 'rcjs:pinch', event);
        });

        this.addEventListener('rcjs:pinchend', function (event) {
            print('End pinch', 'rcjs:pinchend', event);
        });

        this.addEventListener('rcjs:swipestart', function (event) {
            print('Start swipe', 'rcjs:swipestart', event);
        });

        this.addEventListener('rcjs:swipe', function (event) {
            print('Swipe', 'rcjs:swipe', event);
        });

        this.addEventListener('rcjs:swipeend', function (event) {
            print('Swipe ' + rch.getDirection(event.angle), 'rcjs:swipeend', event);
        });

        this.addEventListener('devicemotion', function (event) {
            var table = '<table>\
            <tr><th>Device Motion</th></tr>\
            <tr><td class="sub">acceleration</td></tr>\
            <tr><td>' + printTable(event.acceleration) + '</td></tr>\
            <tr><td class="sub">accelerationIncludingGravity</td></tr>\
            <tr><td>' + printTable(event.accelerationIncludingGravity) + '</td></tr>\
            <tr><td class="sub">rotationRate</td></tr>\
            <tr><td>' + printTable(event.rotationRate) + '</td></tr>\
            </table';
            $('#DeviceMotionEvent').empty().append(table);
        });

        this.addEventListener('deviceorientation', function (event) {
            var table = '<table>\
            <tr><th>Device Orientation</th></tr>\
            <tr><td>' + printTable(event) + '</td></tr>\
            </table';
            $('#DeviceOrientationEvent').empty().append(table);
            //$('.Scenario5 .orientationplane').show();
            // var transform = 'rotateX(' + b + 'deg) rotateY(' + c + 'deg) rotate(' + a + 'deg)';
            // console.log(a+","+b+","+c);
            // $('.Scenario5 .orientationplane > div').css('-webkit-transform', transform);
        });

        function format(val, digits) {
            if (val instanceof Array) {
                if (val.length === 0) return '-'; else return val.toString();
            } else {
                digits = Math.pow(10, digits);
                return Math.round(val * digits) / digits;
            }
        }

        function printTable (obj, digits) {
            digits = digits || 5;
            var t = '<table class="smalldata">';
            for (prop in obj) {
                if (prop === 'type') { continue; }
                //if (obj[prop] instanceof Array) { continue; }
                t += '<tr><td>' + prop + '</td><td>' + format(obj[prop], digits) + '</td></tr>'
            }
            return t += '</table>';
        }

        var lastEvent = null;
        function print (gesture, type, obj) {



            if (lastEvent === type) {
                var evntlst = $('#EventList > div:last-child');
                var cnt = evntlst.find('span');
                if (cnt.length > 0) { 
                    var val = 1 + parseInt(cnt.html());
                    cnt.text(val);
                } else {
                    evntlst.append('<span>1</span>');
                }
            } else {
                $('<div>' + gesture + '</div>').appendTo($('#EventList'));
            }
            gesture = gesture || '(none)';
            $('#Gesture').empty().append(gesture);
            $('#EventType').empty().append(type);
            if (obj) {
                $('#Values').empty().append(printTable(obj));
            }
            lastEvent = type;
        }

        // rch.emitEvent('rcjs:singletouchend', {
        //     clientX: Math.random(),
        //     clientY: Math.random(),
        //     touches: [],
        //     changedTouches: []
        // })

        // rch.emitEvent('devicemotion', {
        //     acceleration: {
        //         x: Math.random(),
        //         y: Math.random(),
        //         z: Math.random()
        //     },
        //     accelerationIncludingGravity: {
        //         x: Math.random(),
        //         y: Math.random(),
        //         z: Math.random()
        //     },
        //     rotationRate: {
        //         alpha: Math.random(),
        //         beta: Math.random(),
        //         gamma: Math.random()
        //     }
        // });
        // rch.emitEvent('deviceorientation', {
        //     alpha: Math.random(),
        //     beta: Math.random(),
        //     gamma: Math.random()
        // });
    }
}
ScenarioLowLevel.prototype = new ScenarioBase();