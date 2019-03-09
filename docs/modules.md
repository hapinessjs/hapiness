# Hapiness: Modules

A `@Module` is the only element than can be bootstrapped. In order the build a web service, you need to create one.

To create a module you just need to implement a `Class` with the decorator `@Module({ ... })`.

Example:
```typescript
@Module({
    version: '1.0.0'
})
class ExampleModule {}
```

Here is the simplest module. Let's see what we can do more.

