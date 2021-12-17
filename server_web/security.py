from __future__ import annotations
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Cipher import AES, PKCS1_v1_5, PKCS1_OAEP
from Crypto.Hash import BLAKE2b, SHA512, SHA1, SHA256
from Crypto.Protocol.KDF import scrypt
from Crypto.Signature import pss
import config as cfg
from typing import Tuple, Union
from os import urandom


class Asymmetric:
    def __init__(self):
        self.public_key: RSA.RsaKey = None
        self.private_key: RSA.RsaKey = None
        # self.rsa_public_key = None
        # self.rsa_private_key = None
        self.can_decrypt = None

    @staticmethod
    def new(lenght=2048) -> Asymmetric:
        key = Asymmetric()

        key.lenght = lenght
        # key.rsa_private_key = RSA.generate(key.lenght)
        # key.rsa_public_key = key.private_key.public_key()
        # key.private_key = PKCS1_OAEP.new(key.rsa_private_key)
        # key.public_key = PKCS1_OAEP.new(key.rsa_public_key)
        rsa_private_key = RSA.generate(key.lenght)
        rsa_public_key = rsa_private_key.public_key()

        key.private_key = PKCS1_OAEP.new(
            rsa_private_key, SHA256)
        key.public_key = PKCS1_OAEP.new(
            rsa_public_key, SHA256)
        key.can_decrypt = True

        return key

    @staticmethod
    def import_from(public: Union[PKCS1_OAEP.PKCS1OAEP_Cipher, bytes],
                    private: Union[None, PKCS1_OAEP.PKCS1OAEP_Cipher, bytes] = None) -> Asymmetric:
        key = Asymmetric()

        # if type(public) == bytes:
        #     key.rsa_public_key = RSA.import_key(public)
        # else:
        #     key.rsa_public_key = public
        # key.public_key = PKCS1_OAEP.new(key.rsa_public_key)

        # key.can_decrypt = False
        # if private is not None:
        #     if type(private) == bytes:
        #         key.rsa_private_key = RSA.import_key(private)
        #     else:
        #         key.rsa_private_key = private
        #     key.private_key = PKCS1_OAEP.new(key.rsa_private_key)
        #     key.can_decrypt = True

        # key.public_key = public if isinstance(public, PKCS1_OAEP.PKCS1OAEP_Cipher) else PKCS1_OAEP.new(
        #     RSA.import_key(public), hashAlgo=SHA512, mgfunc=lambda x, y: pss.MGF1(x, y, SHA512))
        key.public_key = public if isinstance(
            public, PKCS1_OAEP.PKCS1OAEP_Cipher) else PKCS1_OAEP.new(RSA.import_key(public), SHA256, lambda x, y: pss.MGF1(x, y, SHA256))

        return key

    def encrypt(self, msg: str) -> bytes:
        return self.public_key.encrypt(msg.encode(encoding=cfg.get_encoding()))

    def decrypt(self, data: bytes) -> str:
        if self.can_decrypt:
            return self.private_key.decrypt(data).decode(encoding=cfg.get_encoding())
        else:
            raise Exception('Cannot decrypt without private key')

    def export_both(self) -> Tuple[Union[None, bytes], bytes]:
        if self.can_decrypt:
            return (self.rsa_public_key.export_key(), self.rsa_private_key.export_key())
        else:
            return (self.rsa_public_key.export_key(), None)

    def export_public(self) -> bytes:
        return self.public_key._key.export_key('DER')


class Symmetric:
    def __init__(self, key: Union[None, bytes] = None):
        if not key:
            self.key = get_random_bytes(16)
        else:
            self.key = key
        self._create_new()

    def _create_new(self, nonce=None):
        if nonce:
            self.aes = AES.new(self.key, cfg.get_aes_mode(), nonce=nonce)
        else:
            self.aes = AES.new(self.key, cfg.get_aes_mode())

    def encrypt(self, msg: str) -> bytes:
        """
        Encrypt message (msg) using AES method
        :param msg:
        :return:
        """

        self._create_new()

        encrypted, tag = self.aes.encrypt_and_digest(
            msg.encode(encoding=cfg.get_encoding()))
        # print(f'tag len: {len(tag)}, nonce len: {len(self.aes.nonce)}, encrypted len: {len(encrypted)}')
        return self.aes.nonce + tag + encrypted

    def decrypt(self, data: bytes) -> str:
        nonce = data[0:16]
        self._create_new(nonce)
        tag = data[16:32]
        encryped = data[32:]
        msg = self.aes.decrypt_and_verify(
            encryped, tag).decode(encoding=cfg.get_encoding())
        return msg


class Hash:
    bits = 512

    @staticmethod
    def hash(msg: str) -> bytes:
        blake = BLAKE2b.new(data=msg.encode(
            encoding=cfg.get_encoding()), digest_bits=Hash.bits)
        return blake.digest()

    @staticmethod
    def hash_passwd(passwd: str) -> bytes:
        salt = urandom(cfg.get_scrypt_salt_size())
        # noinspection PyTypeChecker
        return salt + scrypt(passwd, salt, N=2**14, r=8, p=1, key_len=cfg.get_scrypt_key_len())
