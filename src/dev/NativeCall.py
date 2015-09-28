__author__ = 'v-lshen'

from ctypes import *
import os

dll_core = CDLL(os.getcwd() + '\dsn.core.dll')
dll_helper = CDLL(os.getcwd() + '\python_helper.dll')

dsn_task_type_t = {'TASK_TYPE_RPC_REQUEST':0, 'TASK_TYPE_RPC_RESPONSE':1, 'TASK_TYPE_COMPUTE':2, 'TASK_TYPE_AIO':3, 'TASK_TYPE_CONTINUATION':4, 'TASK_TYPE_COUNT':5, 'TASK_TYPE_INVALID':6}
dsn_task_priority_t = {'TASK_PRIORITY_LOW':0, 'TASK_PRIORITY_COMMON':1, 'TASK_PRIORITY_HIGH':2, 'TASK_PRIORITY_COUNT':3, 'TASK_PRIORITY_INVALID':4}
dsn_log_level_t = {'LOG_LEVEL_INFORMATION':0, 'LOG_LEVEL_DEBUG':1, 'LOG_LEVEL_WARNING':2, 'LOG_LEVEL_ERROR':3, 'LOG_LEVEL_FATAL':4, 'LOG_LEVEL_COUNT':5, 'LOG_LEVEL_INVALID':6}

dsn_app_create = CFUNCTYPE(c_void_p, c_char_p)
dsn_app_start = CFUNCTYPE(c_int, c_void_p, c_int, POINTER(POINTER(c_char)))
dsn_app_destroy = CFUNCTYPE(c_void_p, c_bool)
dsn_checker_create = CFUNCTYPE(c_void_p, c_char_p, c_void_p, c_int)
dsn_checker_apply = CFUNCTYPE(None, c_void_p)
dsn_task_t = CFUNCTYPE(c_void_p)
dsn_task_tracker_t = CFUNCTYPE(c_void_p)


class Native:
    DSN_MAX_TASK_CODE_NAME_LENGTH = 48
    DSN_MAX_ADDRESS_NAME_LENGTH = 16
    DSN_MAX_BUFFER_COUNT_IN_MESSAGE = 64
    DSN_INVALID_HASH = 0 #not same
    DSN_MAX_APP_TYPE_NAME_LENGTH = 32
    DSN_CORE_DLL = 'dsn.core.dll'

    @staticmethod
    def dsn_register_app_role(type_name, create, start, destroy):
        return dll_helper.dsn_register_app_role_helper(type_name.encode(), create.encode(), start.encode(), dsn_app_destroy(destroy))

    '''
    run the system with arguments
            config [-cargs k1=v1;k2=v2, -app app_name, -app_index index]
    e.g.,   config.ini -app replica -app_index 1 to start the first replica as a new process
            config.ini -app replica to start ALL replicas (count specified in config) as a new process
            config.ini -app replica -cargs replica-port=34556 to start ALL replicas with given port variable specified in config.ini
            config.ini to start ALL apps as a new process
    '''
    @staticmethod
    def dsn_run(argc, argv, sleep_after_init): # void dsn_run(int argc, string[] argv, bool sleep_after_init)
        return dll_helper.dsn_run_helper(argc, argv, sleep_after_init)

    @staticmethod
    def dsn_address_build(ep, host, port):
        dll_helper.dsn_address_build_helper(byref(ep), host.encode(), port)

    @staticmethod
    def dsn_task_create(code, param, hash):
        return dll_helper.dsn_task_create_helper(code, param, hash)

    @staticmethod
    def dsn_task_create_timer(code, param, hash, interval_milliseconds):
        return dll_helper.dsn_task_create_timer_helper(code, param, hash, interval_milliseconds)

    @staticmethod
    def dsn_task_call(task, callback_owner, delay_milliseconds):
        return dll_helper.dsn_task_call_helper(c_void_p(task), c_void_p(callback_owner), delay_milliseconds)

    @staticmethod
    def dsn_rpc_call(addr, rpc_call, tracker):
        return dll_helper.dsn_rpc_call_helper(byref(addr), c_void_p(rpc_call), c_void_p(tracker))

    @staticmethod
    def dsn_rpc_create_response_task(msg, param, reply_hash):
        return dll_helper.dsn_rpc_create_response_task_helper(c_void_p(msg), param, reply_hash)

    @staticmethod
    def dsn_msg_create_request(code, timeout_milliseconds, request_hash):
        return dll_core.dsn_msg_create_request(code, timeout_milliseconds, request_hash)

    @staticmethod
    def marshall(msg, request_content):
        return dll_helper.marshall_helper(c_void_p(msg), request_content)

    @staticmethod
    def dsn_task_code_register(name, type, pri, pool):
        return dll_core.dsn_task_code_register(name.encode(), type, pri, pool)

    @staticmethod
    def dsn_threadpool_code_register(name):
        return dll_core.dsn_threadpool_code_register(name.encode())

    @staticmethod
    def dsn_rpc_register_handler(code, name, param):
        return dll_helper.dsn_rpc_register_handler_helper(code, name.encode(), param)

    @staticmethod
    def dsn_rpc_reply(response):
        return dll_core.dsn_rpc_reply(c_void_p(response))

    @staticmethod
    def marshall_int_msg(msg, response_content):
        return dll_helper.marshall_int_msg_helper(msg, response_content)

    @staticmethod
    def dsn_task_cancel(task, cleanup):
        return dll_core.dsn_task_cancel(c_void_p(task), c_bool(cleanup))

    @staticmethod
    def dsn_rpc_call_wait(addr, request, ss):
        return dll_helper.dsn_rpc_call_wait_helper(byref(addr), request, c_char_p(ss))

    @staticmethod
    def dsn_rpc_unregiser_handler(code):
        return dll_core.dsn_rpc_unregiser_handler(code)

    @staticmethod
    def dsn_error_register(err):
        return dll_core.dsn_error_register(err.encode())












