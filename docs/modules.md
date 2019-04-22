# Hapiness: Modules

A `Module` is the only element than can be bootstrapped. In order the build a web service, you need to create one.

To create a module you just need to implement a `Class` with the decorator `@Module()`.

Example:
```typescript
@Module({
    version: '1.0.0'
})
class ExampleModule {}
```
[See a full example](../examples/basic.ts)

## Methods
Any module can be boostrapped, but only this one can implements the `onStart` and/or `onError` method:

```typescript
@Module({
    version: '1.0.0'
})
class ExampleModule {

    onStart() {
        console.log('App started');
    }

    onError(error: Error) {
        console.log(error);
    }

}
```

The others can use `onRegister`:

```typescript
@Module({
    version: '1.0.0'
})
class ExampleModule {

    onRegister() {
        console.log('Module registered');
    }

}
```

## Options

key | description
--- | ---
`version` | version of the module
`components` | list of components that need to be instantiated
`providers` | list of providers that is instantiated by the di and available through it in the module
`imports` | list of modules to import
`exports` | list of providers that is provided by this module to its parent, it includes the dependencies of the providers exported
`prefix` | allow the module to add a prefix in the routing (default: true)