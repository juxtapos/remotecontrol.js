


 

host application sends a 'register' message to the touch remote app. 

host application sends a 'getToken' message to touchremote app, which answers with a 
'receiveToken' message. 

touchpad application sends a 'supplyToken' message to the touchremote app, which answers
with a 'tokenAccepted' message, if this token is known: it was previously issued to a 
host application and is still valid. 
