# remotecontrol.js

With remotecontrol.js you can utilize a touch-enabled device like an iPad, tablet PC or even smartphone 
as a remote control for your web application. For this to work, an additional web page that is designed
for touch devices needs to be created that contains the remote library.
Visiting this page, a user can connect to a host application using a security token and interact with the application by having his touch and gesture events sent to it. Any application can be made a host application by simply 
including the host library and using its API. Remote events can be processed like any standard event. 
A Webkit-based browser on the touch device is 
currently required, Internet Explorer support will follow. The provided example shows real-time interaction 
with the host user interface, but is very basic. This basic design should however already allow for 
awesome interaction scenarios. 

remotecontrol.js consists of a small node.js-powered web applications and two client libraries that
handle sending and receiving events from one device to the other. Communication is based on
WebSockets, more specifically on the really good socket.io library (that has a large set of
fallbacks for older browsers). In order to connect to a web application, a touch device must supply
a random token that was issued by the server on behalf of the application. Each token has an expiry
date (60 seconds by default).

remotecontrol.js is supposed to be a starting point and itself stay lightweight. If you want a
fancy application with individual touch and gesture support, you need to design them and create your 
own handling. Read the Safari documentation to get an understanding of the design of touch and gesture 
events. This is an experiment more than a seriously pursued project. Drop me a line if you have an idea. 
Maybe trying to tweak a multi-touch library like hammer.js to cooperate with remotecontro.js is a 
good way to move forward. 


## Install

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

## Run

For the example setup to run, the ./example folder in the project root must be available over HTTP. 
HTTP is required due to some browsers, e.g. Chrome, not allowing http:// requests from a file:// origin.

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

## Design

The basic design is really simple: two web clients, one acting as the host application, the other
acting as a remote touch device are connected via a light-weight server application that is powered by 
a rather simple node.js script. Connection is established using Websockets between each of the 
clients and the server application, the server is a mere proxy for most communication flowing from a 
touch client to its host application (only one remote device can connect to a host application at any time).
The larger part of the server application implements the logic to tear up and down connections, using
a simple token-based security system (see #ConnectionHandling).

A three-tiered setup is required because of the Websocket API's missing support for initiating socket connections
on web clients. One would typically have the remote, the host and the server application running on the same host, 
but every other setup is possible, as socket.io supports cross-domain transparently (via CORS or fallback techniques, 
e.g. JSONP).

Types of events that can be captured on the remote device are the (non-standard) DOM touch events created by 
Webkit based browsers (let's talk Webkit, i.e. Chrome, Safari, iOS, Android) that relate to touch and gestures. 
Specifically, these are touchstart, touchchange, touchend, gesturestart, gesturechange, gestureend. Before 
sending an event, it is stripped from any DOM-related information, also all key-related event properties
are stripped (but can be added easily, if required).


## Performance

I have not yet tested this setup with more than two clients connecting and interacting at the same time. 
However, given serious reports on the io performance of node.js, I think it should easily scale to hundreds
of users simultanously. 

## Next Steps

   * Add server configuration file.
   * Handle disconnects, remove token, message opposite.
   * Do some stress tests.
   * Improve touch and gesture recognition.

## Licensing

Modified BSD. Wisely your power you must use.  

## Trivia

As of today, the project contains more documentation than code. Thank you, Javascript. 