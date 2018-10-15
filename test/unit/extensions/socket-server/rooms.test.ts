import { EventEmitter } from 'events';
import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { Socket, WebSocketServer } from '../../../../src/extensions/socket-server';
import { WebSocketRooms } from '../../../../src/extensions/socket-server/rooms';

@suite('Unit - WebSocketRooms')
export class WebSocketRoomsTestSuite {
    @test('Create new instance')
    testInstance() {
        const instance = new WebSocketRooms();
        unit.object(instance).isInstanceOf(WebSocketRooms);
        unit.function(instance.emit);
        unit.function(instance.exists);
        unit.function(instance.getRooms);
        unit.function(instance.join);
        unit.function(instance.leave);
    }

    @test('Should test all functions')
    testFunctions() {
        const connection1 = {
            sendUTF() {
            }, on() {
            }
        };
        const connection2 = {
            sendUTF() {
            }, on() {
            }
        };
        unit.stub(connection1, 'sendUTF');
        unit.stub(connection2, 'sendUTF');
        const instance = new WebSocketRooms();
        const socket1 = new Socket(<any>{}, <any>connection1, instance);
        const socket2 = new Socket(<any>{}, <any>connection2, instance);
        instance.join('room1', socket1);
        unit.object(instance.getRooms()).is({ room1: [ socket1 ] });
        instance.leave('room1', socket1);
        instance.leave('room1', socket2);
        instance.leave('room2', socket1);
        instance.join('room1', socket2);
        unit.object(instance.getRooms()).is({ room1: [ socket2 ] });
        instance.emit('room1', 'message', { foo: 'bar' });
        instance.emit('room2', 'message', { foo: 'bar' });
        unit.number(connection1.sendUTF[ 'callCount' ]).is(0);
        unit.number(connection2.sendUTF[ 'callCount' ]).is(1);
        unit.array(connection2.sendUTF[ 'firstCall' ][ 'args' ]).is([ JSON.stringify({
            event: 'message',
            data: { foo: 'bar' }
        }) ]);
        instance.join('room1', socket1);
        unit.object(instance.getRooms()).is({ room1: [ socket2, socket1 ] });
        instance.emit('room1', 'message', { foo: 'bar' });
        unit.number(connection1.sendUTF[ 'callCount' ]).is(1);
        unit.number(connection2.sendUTF[ 'callCount' ]).is(2);
    }

    @test('Should test Socket shortcuts')
    testSocketShortcuts() {
        const connection1 = <any>new EventEmitter();
        const connection2 = <any>new EventEmitter();
        const instance = new WebSocketRooms();
        const socket1 = new Socket(<any>{}, <any>connection1, instance);
        const socket2 = new Socket(<any>{}, <any>connection2, instance);
        unit.object(socket1.join('room1')).is(socket1);
        socket2.join('room1');
        connection1.emit('close');
        unit.array(instance.getRooms().room1).is([ socket2 ]);
        socket2.leave('room1');
    }

    @test('Should test WebSocketServer shortcuts')
    testWebSocketServerShortcuts() {
        const connection1 = <any>new EventEmitter();
        connection1.sendUTF = () => {
        };
        const connection2 = <any>new EventEmitter();
        connection2.sendUTF = () => {
        };
        unit.stub(connection1, 'sendUTF');
        unit.stub(connection2, 'sendUTF');
        const webSocketServer = new WebSocketServer({ port: 2000 });
        webSocketServer.start();
        unit.function(webSocketServer.to);
        const instance = webSocketServer[ 'rooms' ];
        const socket1 = new Socket(<any>{}, <any>connection1, instance);
        const socket2 = new Socket(<any>{}, <any>connection2, instance);
        socket1.join('room1').join('room2');
        socket2.join('room2');
        webSocketServer.to('room1', 'message', { foo: 'bar' }).to('room2', 'message', { foo: 'baz' });
        unit.number(connection1.sendUTF[ 'callCount' ]).is(2);
        unit.number(connection2.sendUTF[ 'callCount' ]).is(1);
        unit.array(connection2.sendUTF[ 'firstCall' ].args).is([
            JSON.stringify({
                event: 'message',
                data: { foo: 'baz' }
            })
        ]);
        webSocketServer.getHttpServer().close();
        webSocketServer.getServer().shutDown();
    }
}
