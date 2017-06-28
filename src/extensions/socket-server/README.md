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

## Socket
Socket object provided when a new connection comes in the ServerSocket

- methods
    - `on` - Add listener on a new event coming from the socket
    - `onBytes` - Add listener on a new binary data coming from the socket
    - `emit` - Send data into the socket
    - `emitBytes` - Send binary data
    - `close` - Close the socket


## WebSocketServer
WebSocket server

- methods
    - `onRequest` - Callback called at each new socket connection
        - arguments: ((socket: Socket) => void)
    - `getSockets` - Return all active sockets
        - return: Socket[]
    - `broadcast` - Broadcast data to all active sockets
        - arguments: (event: string, data: any)
    - `getServer` - Return websocket server instance

## Example

```javascript
    @HapinessModule({
        version: 'x.x.x'
    })
    class SocketServerModule implements OnStart {

        constructor(@Inject(SocketServerExt) private server: WebSocketServer) {}

        onStart() {
            this.server.onRequest((socket: Socket) => {
                socket.on('message', _ => console.log(_));
                socket.emit('message', 'Hello World!');
                this.server.broadcast('join', 'Hello World!');
            });
        }

    }
    Hapiness.bootstrap(Module,
        [
            SocketServerExt.setConfig({ port: 1234 })
        ]
    );
```
