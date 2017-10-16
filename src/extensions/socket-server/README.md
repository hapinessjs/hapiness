# Socket Server Extension

## Usage

```javascript
    Hapiness.bootstrap(Module,
        [
            SocketServerExt.setConfig({...})
        ]
    );
```

Configuration:
```javascript
    {
        port: number;
        autoAcceptConnections?: boolean;
        keepaliveInterval?: number;
        keepaliveGracePeriod?: number;
        closeTimeout?: number;
    }
```

## Extension provider

```javascript
    ...
    constructor(@Inject(SocketServerExt) private server: WebSocketServer) {}
    ...
```
Allow to get the hapi server instance

## Extension service
```javascript
    ...
    constructor(private server: SocketServerService) {}
    ...
```

## Socket
Socket object provided when a new connection comes in the ServerSocket

- methods
    - `on$` - Listen new event with an Observable
    - `on` - Add listener on a new event coming from the socket
    - `onBytes` - Add listener on a new binary data coming from the socket
    - `emit` - Send data into the socket
    - `emitBytes` - Send binary data
    - `close` - Close the socket
    - `join` - Join room
    - `leave` - Leave a room


## WebSocketServer
WebSocket server

- methods
    - `configure` - Allow to configure a secure callback to accept new request
        - arguments: request => Observable\<boolean\>
        - return: connections()
    - `connections` - Observable providing accepted requests
        - return: Subject\<Socket\>
    - `getSockets` - Return all active sockets
        - return: Socket[]
    - `broadcast` - Broadcast data to all active sockets
        - arguments: (event: string, data: any)
    - `getServer` - Return websocket server instance
    - `to` - Emit a message to a room

## Example

```javascript
    @HapinessModule({
        version: 'x.x.x',
        providers: [ SocketServerService ]
    })
    class SocketServerModule implements OnStart {

        constructor(private server: SocketServerService) {}

        onStart() {
            this
                .server
                .connections()
                .subscribe(
                    socket => {
                        socket.on('message', _ => console.log(_));
                        socket.emit('message', 'Hello World!');
                        this.server.broadcast('join', 'Hello World!')
                    }
                );
            });
        }

    }
    Hapiness.bootstrap(Module,
        [
            SocketServerExt.setConfig({ port: 1234 })
        ]
    );
```
