__author__ = 'v-lshen'
import struct
import binascii


class RpcStream:
    __content_b = bytes()

    def write(self, type, content):
        self.__content_b += struct.pack(type, content)

    def get_content(self):
        return binascii.b2a_uu(self.__content_b)

    @staticmethod
    def read(type, content):
        return struct.unpack(type, binascii.a2b_uu(content))
