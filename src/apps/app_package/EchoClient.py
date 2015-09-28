__author__ = 'v-lshen'

from .EchoCodeDefinition import *
from .EchoServer import *
from dev.Clientlet import *


class EchoClient:
    __server = None
    def __init__(self, server):
        self.__server = server

    def get_server(self):
        return self.__server

    def echo_sync(self, request_content):
        ss = create_string_buffer(1000)
        resp = Clientlet.rpc_call_sync(RPC_ECHO, self.get_server().get_addr(), request_content, ss)
        unpacked_data = RpcStream.read('7s9sii', c_char_p(resp).value)
        return unpacked_data

    def echo_async(self, request_content):
        global last_time
        last_time = time.time()
        Clientlet.rpc_call_async(RPC_ECHO, self.get_server().get_addr(), request_content, self, self.on_timer_echo_callback, 0)
        return

    @staticmethod
    def on_timer_echo_callback(rpc_response):
        # client receive echo response
        unpacked_data = RpcStream.read('7s9sii', rpc_response)
        global count_time
        global current_time
        global last_time
        count_time = count_time + 1
        if(count_time % 10000 == 0):
            __current_time = time.time()
            print('rpc_one_round_time: ', round(__current_time - last_time, 2), 's')
            last_time = __current_time
        rpc_stream = RpcStream()
        rpc_stream.write('f', 12.345678)
        rpc_stream.write('6s', b'ahaaaa')
        request_content = rpc_stream.get_content()
        next_addr = DsnAddressT()
        next_addr.ip = int(unpacked_data[2])
        next_addr.port = int(unpacked_data[3])
        Clientlet.rpc_call_async(RPC_ECHO, next_addr, request_content, EchoClient, EchoClient.on_timer_echo_callback, 0)