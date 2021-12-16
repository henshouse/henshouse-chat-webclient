from threading import Thread
from datetime import datetime
from typing import Union
import websockets as ws
import asyncio

from log import log_message, log_disconnect, log
from security import Symmetric, Asymmetric, Hash
from constants import MSG_ZFILL, ENCODING
from security import Symmetric, Asymmetric, Hash
# from server import Server


class Connection:
    @staticmethod
    def new(sock, addr, server, n):
        conn = Connection(sock, addr, server, n)
        asyncio.ensure_future(conn.run())
        return conn

    def __init__(self, ws: ws.WebSocketServerProtocol, addr: str, server, nick: str):
        Thread.__init__(self)
        self.ws = ws
        self.addr = addr
        print(f'[*] New Connection {self.addr}')

        self.server = server

        self.nick = nick

    async def send(self, msg: bytes):
        await self.ws.send(msg)

    async def recv(self) -> bytes:
        return await self.ws.recv()

    async def recv_str(self) -> str:
        return self.server.local_asym.decrypt(await self.recv())

    async def send_str(self, msg: str):
        return await self.send(self.server.local_asym.encrypt(msg))

    async def close(self):
        await self.ws.close()
        print(f'before: {self.server.conns}')
        self.server.conns.remove(self)
        print(f'after: {self.server.conns}')
        log_disconnect(self.addr, self.nick)

    async def run(self):
        import traceback
        try:
            await self.send(self.server.local_asym.export_public())
            self.remote_asym = Asymmetric.import_from(await self.recv())
            await self.send(self.nick)
            async for msg_en in self.ws:
                # msg = self.server.local_asym.decrypt(msg_en)
                msg = msg_en
                # print(f'[*][{datetime.now()}]  ' + self.nick + ' > ' + msg)
                # _msg = msg.replace('  ', ' ')
                # while '  ' in _msg:
                #     _msg = _msg.replace('  ', ' ')
                if msg.split(' ')[0].lower() == '/nick' and len(msg.split(' ')) > 1:
                    self.nick = msg.split(' ')[1]
                await self.server.send_to_all_raw(msg, self)
                log_message(self.nick, self.addr, msg)
        except ws.exceptions.ConnectionClosedOK as e:
            print('connection ok closed')
            print(e)
            # print(e.with_traceback())
            traceback.print_exc()
            # print(f'[*] {self.addr} Connection closed')
            await self.close()
        except Exception as e:
            print(e)
            await self.close()