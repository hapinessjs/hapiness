# EventManager Extension

Extension that allow to send events through all modules

## Usage

```javascript

    @HapinessModule({
        version: '...',
        providers: [ EventService ]
    })
    class SubModule {

        constructor(private event: EventService) {}

        onRegister() {
            this.event
                .on('type')
                .subscribe(_ => console.log(_.data));
        }
    }

    @HapinessModule({
        version: '...',
        providers: [ EventService ],
        imports: [ SubModule ]
    })
    class Module {

        constructor(private event: EventService) {}

        onStart() {
            this.event.emit('type', { data: {} });
        }
    }

    Hapiness.bootstrap(Module,
        [
            EventManagerExt
        ]
    );
```

## Extension provider

```javascript
    ...
    constructor(@Inject(EventManagerExt) private eventManager: EventManager) {}
    ...
```
