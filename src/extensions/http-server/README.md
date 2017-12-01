# HTTP Server Extension

The extension is based on HapiJS

## Usage

```javascript
    Hapiness.bootstrap(Module,
        [
            HttpServerExt.setConfig({...})
        ]
    );
```

```
{
    host: string
    port: number
    options?: ServerOptions
}
//or
{
    connections: ConnectionOptions[]
    options?: ServerOptions
}
```

Configuration - [HapiJS Connection options](https://hapijs.com/api#serverconnectionoptions)

## Extension provider

```javascript
    ...
    constructor(@Inject(HttpServerExt) private server: Server) {}
    ...
```
Allow to get the hapi server instance

## Route
Declare HTTP routes

```javascript
    @Route({metadata})
    class MyClass {}
```

- metadata

    - `path` - route path (/my/path)
    - `method` - can be an array, values: (get, post, put, delete, patch, options)
    - `config` - partially implemented, see [HapiJS Route config](https://hapijs.com/api#route-configuration)
    - `providers` - Providers to add in the request DI, it means at each request a new instance of the provider will be created
    - `labels`- `string | string[]` Used to attach a route to a connection for multiple connections

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
    - `OnPreAuth` - Request lifecycle handler
        - arguments: (request, reply)
    - `OnPostAuth` - Request lifecycle handler
        - arguments: (request, reply)
    - `OnPreHandler` - Request lifecycle handler
        - arguments: (request, reply)
    - `OnPostHandler` - Request lifecycle handler
        - arguments: (request, reply)
    - `OnPreResponse` - Request lifecycle handler
        - arguments: (request, reply)

## Lifecycle

Request lifecycle component

```javascript
    @Lifecycle({
        event: 'onPreAuth'
    })
    class MyHook implements OnEvent {
        onEvent(request, reply) {
            ...
        }
    }
```

- metadata

    - `event` - request lifecycle event, see [HapiJS Request lifecycle](https://hapijs.com/api#request-lifecycle)
    events: (onPreAuth, onPostAuth, onPreHandler, onPostHandler, onPreResponse)

- interfaces

    - see request and reply on [HapiJS Docs](https://hapijs.com/api#requests)
    - `OnEvent` - Lifecycle handler