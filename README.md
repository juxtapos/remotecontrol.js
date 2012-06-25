# remotecontrol.js

## What is it? 

With remotecontrol.js you can utilize a touch-enabled device like an iPad, tablet PC or even smartphone 
as a remote control for your web application. User interaction events like touches and gestures can be captured on a 
touch-device and are sent to a receiver application in realtime. Depending on the UI event capabilities of the 
touch-device (more specifically, its browser), complex interaction with your application's user interface becomes 
possible, e.g. 2D painting and object manipulation, zooming, swiping, rotating.

Basically, remotecontrol.js is an event-relay system, its meant as a starting point for further experiments. If you want 
a fancy web application with e.g. touch and gesture support from a remote device, remotecontrol.js is a starting point.
This is an experiment more than a seriously pursued project.

## How does it Work?

The basic design of remotecontrol.js is really simple and consists of three components: a lightweight node.js 
server application and two web clients that both include the remotecontrol.js libraries and connect to the server
application, one of the acting as the receiver, the other as the sender. On the sending side, events are simply captured, 
serialized, transmitted to the server and from there to a linked application. For each user displaying a 
remotecontrol.js-enabled web application, remote control is possible by a user opening a designated remote control 
web page on his touch-enabled device. Linking a receiver and sender pair is secured by tokens. 
Such a token can be requested by the receiving application from the server and is then displayed to the user. This 
token must be entered in the remote control application by the user and is submitted back to the server. If there is a 
token match, both applications are linked. Please see the example pages for a example implementation that you can use as
a blueprint for your own. 

## Under the Hood

Each of the three components can be divided logically into two functional areas, the first handles registration, token
exchange and linking, the second is responsible for capturing, transmitting and receiving events. All events that are
supported by a remote device can be captured and transmitted. This set of devices depends on the browser that is used, 
it is the receiving application's job to react to events as desired. For an application to react to remote events, 
the receiving component implements the Observer pattern, for each type of event, one or multiple listeners may be 
attached. Communication between receiver and sender clients and the server application takes place via Websockets 
(using the excellent socket.io library, that provides fallbacks for many different devices that don't support Websockets
natively). Each token that was requested from the server application has a limited lifetime (60 seconds by default), after this
time has expired, it can't be used anymore. 

## Usage

### Install

You need node.js, npm (included in node.js nowadays), a git client and an HTTP server. 
Everything should be running on a unixoid OS, r*c*.js was developed on OS X. It should 
run fine on Windows though when the postinstall shell script (./node/bin/postinstall.sh) is adopted. 

Clone the project with

    $ https://github.com/juxtapos/remotecontrol.js.git

In your working directory, you'll find two folders after cloning: ./node contains the server-side
node.js application. Before the first run, dependencies must be installed:

    $ cd ./node npm install

On postinstall, the minified socket.io client library file is copied from the installation directory
(in ./node/node_modules) to the ./example folder (where it's needed by the host and remote client
example applications).

### Run

For the example setup to run, the ./example folder in the project root must be available over HTTP. 
HTTP is required due to some browsers, e.g. Chrome, not allowing http:// requests from a file:// origin. You need a 
decent browser on your remote device, e.g. IE 10 or Safari on iOS. Android should work theoretically, but wasn't 
tested yet. 

The server is started with

    $ npm start

The default port for WebSocket communication is 1337, change it in the server script for now. 

Now, for testing purposes you obviously you need two devices, both of which need to be able to 
connect to the host running the server application (finding out your host name or IP on a typical 
corporate network might be hard).  
Fire up your favorite browser and
open the Javascript console, you'll need it. Now, open <yourExampleURL>/host.html. After loading
the page, you'll see a token code in your console (you can aquire new tokens using getToken() on the command line).

Next, open <yourExampleURL>/remote.html in your browser on your touch device and enter the token code in the 
textfield and submit it. That's it. Remember the token maximum life time. Currently the debug mode is switched on
for the server application that will send a remote client the last token that was issued automatically
(lazy is good). You should now be able to rotate and scale the ugly red box on the host application. Also,
four seemingly boring black boxes will follow your finger movements in real-time! Impressive, isn't it? Seriously. ;-)

### In Your Application

Please see the files included in the /example folder to gain an understanding of what is required to enable your 
own applications to work with remotecontrol.js.

To create your own remotecontroled application, you need to figure out what types of events you need and on which 
target browser platforms they are available. Cross-browser issues, e.g. for the various touch and gesture event models, 
need to be handled in your application, remotecontrol.js only transmits the captured events. 

For the events received by the receiving component, there is a single limitation: the event object does not contain 
any DOM-related properties, e.g. srcElement, currentTarget, etc. as these don't make sense on the receiving application. 
Instead, any type of selection handling, e.g. to select an object to apply the next operations to, must be implemented 
completely by the receiving component. 

Also, any type of event that is to be captured on the remote device, needs to be enabled on both the sender and receiver
side. Currently enabled are touchstart, touchchange, touchend, gesturestart, gesturechange, gestureend (Webkit/Safari) 
and MSPointerDown, MSPointerMove, MSPointerUp, MSGestureStart, MSGestureChange, MSGestureEnd (IE 10+).

## Performance

I have not yet tested this setup with more than two clients connecting and interacting at the same time. 
However, given reports on the i/o performance of node.js, I think it should easily scale to hundreds
of users simultanously. 

## Licensing

Modified BSD. Wisely your power you must use.  

## Trivia

As of today, the project contains more documentation than code. Thank you, Javascript. 