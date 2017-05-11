# API Reference

## Getting started

    @Injectable()
    class DataService {
        data(): Observable<any> {
            return Observable.create(obs => {
                obs.next('my-data');
                obs.complete();
            })
        }
    }

    @Route({
        path: '/data',
        method: 'get'
    })
    class DataRoute implements OnGet {
        constructor(private dataService: DataService) {}

        onGet(request, reply) {
            this.dataService.data()
                .subscribe(d => reply(d));
        }
    }

    @HapinessModule({
        version: '1.0.0',
        declaration: [ DataRoute ],
        providers: [ DataService ],
        options: {
            host: '0.0.0.0',
            port: 8080
        }
    })
    class DataModule implements OnStart, OnError {

        constructor(private httpServer: HttpServer) {}

        onStart() {
            console.log('Server started at: ', this.httpServer.info.uri);
        }

        onError(err: Error) {
            console.error(err);
        }

    }

    // Start the server
    Hapiness.bootstrap(DataModule);



## Hapiness
The Hapiness object is used to bootstrap a module as Web Server.

### bootstrap(module)
Bootstrap a module and start the web server.

## HapinessModule
Declare an Hapiness module with the providers, routes and libs.

    @HapinessModule({metadata})
    class MyClass {}

- metadata

    - `version` - module version
    - `options`
        - bootstrapped module : 
            - `host` - server host
            - `port` - http server port
            - `socketPort` - websocket server port
    - `declarations` - Routes | Libs to declare in the module
    - `providers` - Providers to add in the DI
    - `imports` - Modules to import
    - `exports` - Providers to export and will be available in the module that import it

- interfaces
    - `OnStart` - Only for the bootstrapped module, called when the web server is started.
    - `OnError` - Only for the bootstrapped module, it is the error handler.
        - arguments: (error: Error)
    - `OnRegister` - Called when the module is registered
    - `OnModuleResolved` - Called when imported module is resolved
        - arguments: (module: string)

## Provide config through a module
When you import a module, you can provide data.

    @HapinessModule({
        ...
    })
    class ModuleNeedData {
        static setConfig(config: MyConfig): CoreModuleWithProviders {
            return {
                module: ModuleNeedData,
                providers: [{ provide: MyConfig, useValue: config }]
            };
        }
        constructor(@Optional() config: MyConfig) {
            ...
        }
    }

    @HapinessModule({
        ...
        imports: [ ModuleNeedData.setConfig({ hello: 'world!' }) ]
    })
    ...

## Route
Declare HTTP routes

    @Route({metadata})
    class MyClass {}

- metadata

    - `path` - route path (/my/path)
    - `method` - can be an array, values: (get, post, put, delete, patch, options)
    - `config` - partially implemented, see [HapiJS Route config](https://hapijs.com/api#route-configuration)
    - `providers` - Providers to add in the request DI, it means at each request a new instance of the provider will be created

- interfaces
    - see request and reply on [HapiJS Docs](https://hapijs.com/api#requests)
    - `OnGet` - Http Get handler
        - arguments: (request, reply)
    - `OnPost` - Http Post handler
        - arguments: (request, reply)
    - `OnPut` - Http Put handler
        - arguments: (request, reply)
    - `OnDelete` - Http Delete handler
        - arguments: (request, reply)
    - `OnPatch` - Http Patch handler
        - arguments: (request, reply)
    - `OnOptions` - Http Options handler
        - arguments: (request, reply)

## Injectable
Declare an injectable provider

    @Injectable()
    class MyService {}

## Lib
Declare an empty component for any use

    @Lib()
    class MyLib {}

## Optional
When you ask for a dependency, Optional tell to the DI to not throw an error if the dependency is not available.

    ...
    constructor(@Optional() dep: MyDep) {
        if (dep) {
            ...
        }
    }
    ...

## Inject & InjectionToken
Create custom token for the DI

    const MY_CUSTOM_TOKEN = new InjectionToken('my-token');

    @HapinessModule({
        ...
        imports: [{ provide: MY_CUSTOM_TOKEN, useValue: 'abcdef' }]
        ...
    })
    class MyModule {
        constructor(@Inject(MY_CUSTOM_TOKEN) myValue) {
            console.log(myValue) // ouput: 'abcdef'
        }
    }

## Instance Providers
### HttpServer

    ...
    constructor(private httpServer: HttpServer) {}
    ...

- properties
    - `instance` - HapiJS server instance

### WSServer

    ...
    constructor(private wsServer: WSServer) {}
    ...

- properties
    - `instance` - ServerSocket instance


## Socket
Socket object provided when a new connection comes in the ServerSocket

- methods
    - `on` - Add listener on a new event coming from the socket
    - `emit` - Send data into the socket
    - `emitAll` - Send data to all active sockets
    - `close` - Close the socket


## ServerSocket
Use Hapiness as a WebSocket server

- methods
    - `onRequest` - Callback called at each new socket connection
        - arguments: ((socket: Socket) => void)
    - `getSockets` - Return all active sockets
        - return: Socket[]
    - `broadcast` - Broadcast data to all active sockets
        - arguments: (event: string, data: any)

### Example
    @HapinessModule({
        version: 'x.x.x',
        options: {
            host: '0.0.0.0',
            port: 1234,
            socketPort: 1235 // port websocket
        }
    })
    class SocketServerModule implements OnStart {

        constructor(private wsServer: WSServer) {}

        onStart() {
            this.wsServer.instance.onRequest((socket: Socket) => {
                socket.on('message', _ => console.log(_));
                socket.emit('message', 'Hello World!');
                this.wsServer.instance.broadcast('join', 'Hello World!');
            });
        }

    }
    Hapiness.bootstrap(SocketServerModule);