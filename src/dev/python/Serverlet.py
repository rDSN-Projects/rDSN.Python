__author__ = 'v-lshen'

from Utils import *
from RpcStream import *


class Serverlet:

    @staticmethod
    def register_rpc_handler(code, name, callback):
        global function_dict
        function_dict[id(callback)] = callback
        Native.dsn_rpc_register_handler(code, name, id(callback))

    @staticmethod
    def rpc_reply(msg, response_content):
        Native.marshall(msg, response_content) # TODO
        Native.dsn_rpc_reply(msg)
