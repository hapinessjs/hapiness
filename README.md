<img src="http://bit.ly/2mxmKKI" width="500" alt="Hapiness" />

<div style="margin-bottom:20px;">
<div style="line-height:60px">
    <a href="https://travis-ci.org/hapinessjs/hapiness.svg?branch=master">
        <img src="https://travis-ci.org/hapinessjs/hapiness.svg?branch=master" alt="build" />
    </a>
    <a href="https://coveralls.io/github/hapinessjs/hapiness?branch=master">
        <img src="https://coveralls.io/repos/github/hapinessjs/hapiness/badge.svg?branch=master" alt="coveralls" />
    </a>
    <a href="https://david-dm.org/hapinessjs/hapiness">
        <img src="https://david-dm.org/hapinessjs/hapiness.svg" alt="dependencies" />
    </a>
    <a href="https://david-dm.org/hapinessjs/hapiness?type=dev">
        <img src="https://david-dm.org/hapinessjs/hapiness/dev-status.svg" alt="devDependencies" />
    </a>
</div>
<div>
    <a href="https://www.typescriptlang.org/docs/tutorial.html">
        <img src="https://cdn-images-1.medium.com/max/800/1*8lKzkDJVWuVbqumysxMRYw.png"
             align="right" alt="Typescript logo" width="50" height="50" style="border:none;" />
    </a>
    <a href="http://reactivex.io/rxjs">
        <img src="http://reactivex.io/assets/Rx_Logo_S.png"
             align="right" alt="ReactiveX logo" width="50" height="50" style="border:none;" />
    </a>
    <a href="http://hapijs.com">
        <img src="http://bit.ly/2lYPYPw"
             align="right" alt="Hapijs logo" width="75" style="border:none;" />
    </a>
</div>
</div>

# Web and services application framework

[Hapiness](https://github.com/hapinessjs) is a web framework based on [HapiJS](https://hapijs.com/) and enhanced with [Dependency Injection](https://github.com/mgechev/injection-js), strong **modularisation** and **decorators**.

It provides a real enhancement for building **web servers** and it enables to build **modules**, **services**, etc. quickly.

It has a stable and tested [dependency injection](https://github.com/mgechev/injection-js) system thanks to [Angular](https://angular.io).

Better development experience with **typings**, **maintainability**, **improvement of productivity** and a **common project structure**.

**Everything in a single uniform framework**.

## Table of contents

* [Technologies](#technologies)
* [Using Hapiness to create a web server and services](#using-hapiness-to-create-a-web-server-and-services)
    * [Yarn or NPM it in your package.json](#yarn-or-npm-it-in-your-packagejson)
    * [Use Hapiness API](#use-hapiness-api)
* [Contributing](#contributing)
* [Change History](#change-history)
* [Maintainers](#maintainers)
* [License](#license)

## Technologies

 - **[HapiJS](https://hapijs.com/)**
	 - `Hapi` enables developers to focus on writing reusable application logic instead of spending time building infrastructure.
 - **[Joi](https://github.com/hapijs/joi)**
	 - Object schema description language and validator for JavaScript objects.
 - **[Boom](https://github.com/hapijs/boom)**
	 - HTTP-friendly error objects
 - **[Good](https://github.com/hapijs/good)**
	 - `Good` is a `Hapi` plugin to monitor and report on a variety of `Hapi` server events as well as ops information from the host machine.
 - **[Typescript](https://www.typescriptlang.org/docs/tutorial.html)**
	 - `TypeScript` is a typed superset of JavaScript that compiles to plain JavaScript.
 - **[RxJS](http://reactivex.io/rxjs)**
	 - `RxJS` is a set of libraries for composing asynchronous and event-based programs using observable sequences and fluent query operators.

All those technologies are `Typescript` ready. It will help to build web servers and maintain them easier.

[Back to top](#table-of-contents)

## Using Hapiness to create a web server and services

### `yarn` or `npm` it in your `package.json`

```bash
$ npm install --save @hapiness/core rxjs

or

$ yarn add @hapiness/core rxjs
```

```javascript
"dependencies": {
    "@hapiness/core": "^1.1.0",
    //...
}
//...
```

### Use Hapiness API

Actually, we're in : **v1.1.0**

See [API](https://github.com/hapinessjs/hapiness/blob/master/API.md) Reference to know what's already implemented.

[Back to top](#table-of-contents)

## Contributing

To set up your development environment:

1. clone the repo to your workspace,
2. in the shell `cd` to the main folder,
3. hit `npm or yarn install`,
4. run `npm or yarn run test`.
    * It will lint the code and execute all tests.
    * The test coverage report can be viewed from `./coverage/lcov-report/index.html`.

[Back to top](#table-of-contents)

## Change History
* v1.1.0 (2017-10-16)
    * `Websocket` Server: Secure configuration
    * Documentation
* v1.0.0 (2017-10-05)
    * Publish all features of API
    * First stable version

[Back to top](#table-of-contents)

## Maintainers

<table>
    <tr>
        <td colspan="5" align="center"><a href="https://www.tadaweb.com"><img src="http://bit.ly/2xHQkTi" width="117" alt="tadaweb" /></a></td>
    </tr>
    <tr>
        <td align="center"><a href="https://github.com/Juneil"><img src="https://avatars3.githubusercontent.com/u/6546204?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/antoinegomez"><img src="https://avatars3.githubusercontent.com/u/997028?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/reptilbud"><img src="https://avatars3.githubusercontent.com/u/6841511?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/njl07"><img src="https://avatars3.githubusercontent.com/u/1673977?v=3&s=117" width="117"/></a></td>
	<td align="center"><a href="https://github.com/tlerias"><img src="https://avatars1.githubusercontent.com/u/3011845?v=3&s=117" width="117"/></a></td>
    </tr>
    <tr>
        <td align="center"><a href="https://github.com/Juneil">Julien Fauville</a></td>
        <td align="center"><a href="https://github.com/antoinegomez">Antoine Gomez</a></td>
        <td align="center"><a href="https://github.com/reptilbud">Sébastien Ritz</a></td>
        <td align="center"><a href="https://github.com/njl07">Nicolas Jessel</a></td>
	<td align="center"><a href="https://github.com/tlerias">Tara Lerias</a></td>
    </tr>
</table>

[Back to top](#table-of-contents)

## License

Copyright (c) 2017 **Hapiness** Licensed under the [MIT license](https://github.com/hapinessjs/hapiness/blob/master/LICENSE.md).

[Back to top](#table-of-contents)
