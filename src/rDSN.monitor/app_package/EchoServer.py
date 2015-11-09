__author__ = 'v-lshen'

from dev.python.Serverlet import *
from EchoCodeDefinition import *
from dev.python.RpcStream import *


class EchoServer:

    def open_servive(self):
        Serverlet.register_rpc_handler(RPC_ECHO, 'RPC_ECHO', self.on_echo)

    @staticmethod
    def on_echo(rpc_request_content, rpc_response):
        # server receive echo request
        unpacked_data = RpcStream.read('f6s', rpc_request_content)
        rpc_stream = RpcStream()
        rpc_stream.write('7s', b'ccccccc')
        rpc_stream.write('9s', b'localhost')
        rpc_stream.write('i', 2130706433)
        rpc_stream.write('i', 8101)
        response_content = rpc_stream.get_content()
        Serverlet.rpc_reply(rpc_response, response_content)
        return

    @staticmethod
    def close_service():
        Native.dsn_rpc_unregiser_handler(RPC_ECHO)
        InterOpLookupTable.dict_release()		
