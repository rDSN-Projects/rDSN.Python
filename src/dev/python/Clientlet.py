__author__ = 'v-lshen'

from Utils import *
from RpcStream import *


class Clientlet:

    @staticmethod
    def build_address(argv1, argv2):
         return Native.dsn_address_build(argv1, argv2)

    @staticmethod
    def call_async(evt, callback_owner, callback, hash = 0, delay_milliseconds = 0, timer_interval_milliseconds = 0):
        global function_dict
        function_dict[id(callback)] = callback
        if(timer_interval_milliseconds == 0):
            task = Native.dsn_task_create(evt, id(callback), hash)
        else:
            task = Native.dsn_task_create_timer(evt, id(callback), hash, timer_interval_milliseconds)
        Native.dsn_task_call(task, id(callback_owner), delay_milliseconds)
        return task

    @staticmethod
    def rpc_call_async(code, server, request, callback_owner, callback, reply_hash):
        global function_dict
        function_dict[id(callback)] = callback
        msg = Native.dsn_msg_create_request(code, 0, 0)

        Native.marshall(msg, request)

        task = Native.dsn_rpc_create_response_task(msg, id(callback), reply_hash)
        Native.dsn_rpc_call(server, task, id(callback_owner))

    @staticmethod
    def rpc_call_sync(code, server, request, ss):
        msg = Native.dsn_msg_create_request(code, 0, 0)
        Native.marshall(msg, request)

        resp = Native.dsn_rpc_call_wait(server, msg, ss.value)

        return resp

    @staticmethod
    def concel_task(task, cleanup):
        return Native.dsn_task_cancel(task, cleanup)
