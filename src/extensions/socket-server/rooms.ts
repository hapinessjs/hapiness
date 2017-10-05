import { Socket } from './socket';

export interface Rooms {
    [key: string]: Array<Socket>;
}

export class WebSocketRooms {
    private rooms: Rooms = {};

    /**
     * Return rooms object
     *
     * @returns {Rooms} rooms
     */
    getRooms(): Rooms {
        return this.rooms;
    }

    /**
     * Test if a room already exists
     *
     * @param {string} room
     * @return boolean
     */
    exists(room: string): boolean {
        return !!this.rooms[room];
    }

    /**
     * Join a room with a socket
     *
     * @param {string} room
     * @param {Socket} socket
     * @returns Socket
     */
    join(room: string, socket: Socket): Socket {
        if (!this.exists(room)) {
            this.rooms[room] = [];
        }

        this.rooms[room].push(socket);
        return socket;
    }

    /**
     * Leave room with a socket
     *
     * @param {string} room
     * @param {Socket} socket
     * @returns Socket
     */
    leave(room: string, socket: Socket): Socket {
        if (!this.exists(room)) {
            return;
        }

        const socketIndex = this.rooms[room].indexOf(socket);
        if (socketIndex > -1) {
            this.rooms[room].splice(socketIndex, 1);
        }

        return socket;
    }

    /**
     * Emit a message to one room
     *
     * @param {string} room
     * @param {string} event
     * @param {any} data
     * @returns WebSocketRooms
     */
    emit(room: string, event: string, data: any): WebSocketRooms {
        if (!this.exists(room)) {
            return;
        }

        this.rooms[room].forEach(socket => {
            socket.emit(event, data);
        });

        return this;
    }
}
