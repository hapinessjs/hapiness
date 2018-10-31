import { suite, test } from 'mocha-typescript';
import { Hapiness, HapinessModule, OnStart, OnRegister } from '../../src/core';
import * as unit from 'unit.js';
import { EventManagerExt, EventService } from '../../src/extensions/event-manager';

@suite('Integration - EventManager')
export class TestSuite {

    @test('EventManager - event inter modules')
    test1(done) {

        @HapinessModule({
            version: '',
            providers: [ EventService ]
        })
        class SubModule1 implements OnRegister {

            constructor(private event: EventService) {}

            onRegister() {
                this
                    .event
                    .on('test')
                    .subscribe(
                        _ => {
                            unit.number(_.data).is(1);
                            done();
                        }
                    )
            }

        }

        @HapinessModule({
            version: '',
            providers: [ EventService ],
            imports: [ SubModule1 ]
        })
        class Module1 implements OnStart {

            constructor(private event: EventService) {}

            onStart() {
                this.event.emit('test', 1);
            }

        }

        Hapiness
            .bootstrap(Module1, [ EventManagerExt ]);

    }

    @test('EventManager - event inter modules multiple times')
    test2(done) {

        @HapinessModule({
            version: '',
            providers: [ EventService ]
        })
        class SubModule1 implements OnRegister {

            incr = 0;

            constructor(private event: EventService) {}

            onRegister() {
                this
                    .event
                    .on('test')
                    .subscribe(
                        _ => {
                            this.incr++;
                            if (this.incr === 3) {
                                done();
                            }
                        }
                    )
            }

        }

        @HapinessModule({
            version: '',
            providers: [ EventService ],
            imports: [ SubModule1 ]
        })
        class Module1 implements OnStart {

            constructor(private event: EventService) {}

            onStart() {
                this.event.emit('test', 1);
                this.event.emit('test', 1);
                this.event.emit('test', 1);
            }

        }

        Hapiness
            .bootstrap(Module1, [ EventManagerExt ]);

    }
}
