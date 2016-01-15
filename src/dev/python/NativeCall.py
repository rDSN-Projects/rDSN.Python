__author__ = 'v-lshen'
__author__cont__ = 'v-chlou'

from ctypes import *
import os
import platform
import warnings

os_type = platform.system()

if os_type=='Windows':
# for windows
    dll_core = CDLL('dsn.core.dll')
    dll_helper = CDLL('dsn.dev.python_helper.dll')
elif os_type=='Linux':
# for linux
    dll_core = CDLL('libdsn.core.so')
    dll_helper = CDLL('libdsn.dev.python_helper.so')
elif os_type=='Darwin':
# for osx
    warnings.warn(
        "On OSX this is not tested. The file name of dynamic libs required check.",
        RuntimeWarning
    )
    dll_core = CDLL('libdsn.core.dylib')
    dll_helper = CDLL('libdsn.dev.python_helper.dylib')

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
        dll_helper.dsn_run_helper.restype = c_void_p
        return dll_helper.dsn_run_helper(argc, argv, sleep_after_init)

    @staticmethod
    def dsn_address_build(host, port):
        dll_helper.dsn_address_build_helper.restype = c_ulonglong
        return dll_helper.dsn_address_build_helper(host.encode(), port)

    @staticmethod
    def dsn_task_create(code, param, hash, tracker):
        dll_helper.dsn_task_create_helper.restype = c_void_p
        return dll_helper.dsn_task_create_helper(code, c_ulonglong(param), hash, c_void_p(tracker))

    @staticmethod
    def dsn_task_create_timer(code, param, hash, interval_milliseconds, tracker):
        dll_helper.dsn_task_create_helper.restype = c_void_p
        return dll_helper.dsn_task_create_timer_helper(code, c_ulonglong(param), hash, interval_milliseconds, c_void_p(tracker))

    @staticmethod
    def dsn_task_call(task, delay_milliseconds):
        dll_helper.dsn_task_call_helper.restype = c_void_p
        return dll_helper.dsn_task_call_helper(c_void_p(task), delay_milliseconds)

    @staticmethod
    def dsn_rpc_call(addr, rpc_call):
        dll_helper.dsn_rpc_call_helper.restype = c_void_p
        return dll_helper.dsn_rpc_call_helper(c_ulonglong(addr), c_void_p(rpc_call))

    @staticmethod
    def dsn_rpc_create_response_task(msg, param, reply_hash, tracker):
        dll_helper.dsn_rpc_create_response_task_helper.restype = c_void_p
        return dll_helper.dsn_rpc_create_response_task_helper(c_void_p(msg), c_ulonglong(param), reply_hash, c_void_p(tracker))

    @staticmethod
    def dsn_msg_create_request(code, timeout_milliseconds, request_hash):
        dll_core.dsn_msg_create_request.restype = c_void_p
        return dll_core.dsn_msg_create_request(code, timeout_milliseconds, request_hash)

    @staticmethod
    def marshall(msg, request_content):
        dll_helper.marshall_helper.restype = c_void_p
        return dll_helper.marshall_helper(c_void_p(msg), request_content)

    @staticmethod
    def dsn_task_code_register(name, type, pri, pool):
        dll_core.dsn_task_code_register.restype = c_int
        return dll_core.dsn_task_code_register(name.encode(), type, pri, pool)

    @staticmethod
    def dsn_threadpool_code_register(name):
        dll_core.dsn_threadpool_code_register.restype = c_int
        return dll_core.dsn_threadpool_code_register(name.encode())

    @staticmethod
    def dsn_rpc_register_handler(code, name, param):
        dll_helper.dsn_rpc_register_handler_helper.restype = c_bool
        return dll_helper.dsn_rpc_register_handler_helper(code, name.encode(), c_ulonglong(param))

    @staticmethod
    def dsn_rpc_reply(response):
        dll_core.dsn_rpc_reply.restype = c_void_p
        return dll_core.dsn_rpc_reply(c_void_p(response))

    @staticmethod
    def marshall_int_msg(msg, response_content):
        dll_helper.marshall_int_msg_helper.restype = c_void_p
        return dll_helper.marshall_int_msg_helper(msg, response_content)

    @staticmethod
    def dsn_task_cancel(task, cleanup):
        dll_core.dsn_task_cancel.restype = c_bool
        return dll_core.dsn_task_cancel(c_void_p(task), c_bool(cleanup))

    @staticmethod
    def dsn_rpc_call_wait(addr, request, ss):
        dll_helper.dsn_rpc_call_wait_helper.restype = c_void_p
        return dll_helper.dsn_rpc_call_wait_helper(c_ulonglong(addr), c_void_p(request), c_char_p(ss))

    @staticmethod
    def dsn_rpc_unregiser_handler(code):
        dll_core.dsn_rpc_unregiser_handler.restype = c_void_p
        return dll_core.dsn_rpc_unregiser_handler(code)

    @staticmethod
    def dsn_error_register(err):
        dll_core.dsn_error_register.restype = c_int
        return dll_core.dsn_error_register(err.encode())

    @staticmethod
    def dsn_cli_run(command_line):
        dll_helper.dsn_cli_run_helper.restype = py_object
        return dll_helper.dsn_cli_run_helper(command_line.encode())

    @staticmethod
    def dsn_app_loader_signal():
        return dll_core.dsn_app_loader_signal()

    @staticmethod
    def dsn_primary_address():
        dll_helper.dsn_run_helper.restype = c_ulonglong
        return dll_core.dsn_primary_address()

