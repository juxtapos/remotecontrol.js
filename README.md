# remotecontrol.js 

Why having your fancy iPad, tablet pc or even smartphone sit idle when you're in front of your desktop machine. You can instead use it as a remote touch-device for your web application. Any touch-enabled device that runs a decent browser with touch event support, e.g. all iOS and Android versions, can connect to a web application and enhance its experience by providing single-touch events and multi-touch gestures. 

remotecontrol.js consists of a small node.js-powered web applications and two client libraries that handle sending and receiving events from one device to the other. Communication is based on WebSockets, more specifically on the really good socket.io library (that has a large set of fallbacks for older browsers). In order to connect to a web application, a touch device must supply a random token that was issued by the server on behalf of the application. Each token has an expiry date (25 secs. default).

Technically, the solution is very simple: all touch and gesture events are captured on the remote device, stripped and sent to the host application via the server application. The larger part of the logic on the server-side consists of tearing up and down connections between host applications and remote devices. 


## Usage 

In your working directory, you'll find two folders after cloning: ./node contains the server-side node.js application. Before the first run, dependencies must be installed: 

    $ cd ./node
    $ npm install

On postinstall, the minified socket.io client library file is copied from the installation directory (in ./node/node_modules) to the ./example folder (where it's needed by the host and remote client example applications).

The server is started with

    $ npm start

The default port for WebSocket communication is 1337, change it in the server script for now.

Now, for testing purposes you obviously you need two devices ;-) Fire up your favorite browser and open the Javascript console, you'll need it. Now, open ./example/host.html via http:// (this is due to some browsers, e.g. Chrome, not allowing http:// requests from a file:// origin). After loading the page, you'll see a token code in your console. 

Open up ./example/remote.html in your browser and enter the token code in the textfield and submit it.

That's it. You should be able to rotate and scale the ugly red box on the host application. Impressive, isn't it ;-)


## Connection Handling

   * Host application sends a 'register' message to the touch remote app. 
   * Host application sends a 'getToken' message to touchremote app, which answers with a 
'receiveToken' message. 
   * Remote application sends a 'supplyToken' message to the touchremote app, which answers
with a 'tokenAccepted' message, if this token is known: it was previously issued to a 
host application and is still valid.