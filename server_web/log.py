from datetime import datetime
from typing import Tuple, Union
from enum import Enum


class LogType(Enum):
    INFO = '*'
    ERROR = '!'


def log(msg: str, type: LogType = LogType.INFO):
    msg = f'[{type.value}][{datetime.now()}] {msg}'
    with open('msgs.log', 'a') as f:
        f.write(msg + '\n')
    print(msg)


def log_message(nick: str, addr: Union[Tuple[str, int], str], msg):
    log(f'{nick} ({addr}) > {msg}', LogType.INFO)


def log_start():
    log('Server started')


def log_connect(addr: Tuple[str, int], nick: str):
    log(f'User {addr} ({nick}) connected', LogType.INFO)


def log_disconnect(addr: Union[Tuple[str, int], str], nick: str):
    log(f'User {addr} ({nick}) disconnected', LogType.INFO)
