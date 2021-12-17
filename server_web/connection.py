from threading import Thread
import websockets as ws
import asyncio

from log import log_message, log_disconnect, log
from security import Symmetric, Asymmetric, Hash


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

        self.server = server

        self.nick = nick

    async def send(self, msg: bytes):
        await self.ws.send(msg)

    async def recv(self) -> bytes:
        return await self.ws.recv()

    async def recv_str(self) -> str:
        return self.server.local_asym.decrypt(await self.recv())

    async def send_str(self, msg: str):
        return await self.send(self.remote_asym.encrypt(msg))

    async def close(self, error: str = None):
        await self.ws.close()
        log_disconnect(self.addr, self.nick, reason=f'Error: {error}')

    async def run(self):
        try:
            key = self.server.local_asym.export_public()
            await self.send(key)
            self.remote_asym = Asymmetric.import_from(await self.recv())
            await self.send(self.nick)
            async for msg_en in self.ws:
                msg = self.server.local_asym.decrypt(msg_en)
                if msg.split(' ')[0] == '/nick' and len(msg.split(' ')) > 1:
                    self.nick = msg.split(' ')[1]
                await self.server.send_to_all(msg, self)
                log_message(self.nick, self.addr, msg)
        except ws.exceptions.ConnectionClosedOK as e:
            await self.close()
        except Exception as e:
            print(e)
            await self.close()
