import { Module, Hapiness, Lib, Service } from '../src';

// Declare my provider

@Service()
class BasicService {
    foo() {
        return 'Hello, World!';
    }
}

// Declare my component

@Lib()
class BasicLib {
    constructor(basicService: BasicService) {
        console.log(basicService.foo());
    }
}

// Declare my root module

@Module({
    version: '1.0.0',
    components: [ BasicLib ],
    providers: [ BasicService ]
})
class BasicModule {}

// Boostrap the BasicModule

Hapiness.bootstrap(BasicModule);
