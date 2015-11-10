__author__ = 'v-lshen'

import sys
import os
import time

from EchoCodeDefinition import *
from EchoServer import *
from EchoClient import *


class EchoServiceClient(ServiceApp):
    __server = None
    __echo_client = None
    __task = None

    def start(self, argv):
        # client obj start
        if(len(argv) < 3):
            raise ValueError('wrong usage: EchoServiceClient server-host server-port')

        self.__server = RpcAddress()
        addr = Clientlet.build_address(argv[1], int(argv[2]))
        self.__server.set_addr(addr)
        self.__echo_client = EchoClient(self.__server)
        self.__task = Clientlet.call_async(LPC_ECHO_TIMER2, self, self.timer, 0, 0, 1000)
        return ERR_OK.get_err()

    def stop(self, cleanup = 0):
        Clientlet.cancel_task(self.__task, cleanup)
        self.__echo_client = None

    def timer(self):
        time.sleep(1)
        rpc_stream = RpcStream()
        rpc_stream.write('f', 12.345678)
        rpc_stream.write('6s', b'ahaaaa')		
        print('sync_resp_data: call ')
		
        request_content = rpc_stream.get_content()
        # async pattern
        #self.__echo_client.echo_async(request_content)
        # sync pattern
        print('sync_resp_data: return ', self.__echo_client.echo_sync(request_content))
        return


class EchoServiceServer(ServiceApp): #TODO
    __echo_server = EchoServer()
    def start(self, argv):
        # server obj start
        self.__echo_server.open_servive()
        return ERR_OK.get_err()

    def stop(self):
        self.__echo_server.close_service()
        self.__echo_server = None
