__author__ = 'v-lshen'

from .NativeCall import *
from .InterOpLookupTable import *
import time

count_time = 0
current_time = 0
last_time = 0


class ErrorCode:
    __error = None
    def __init__(self, int_err = None, ErrorCode = None, string_err = None):
        if(int_err != None):
            self.__error = int_err
        elif(ErrorCode != None):
            self.__error = ErrorCode.__error
        else:
            self.__error = Native.dsn_error_register(string_err)

    def get_err(self):
        return self.__error

ERR_OK = ErrorCode(None, None, 'ERR_OK')


class RpcAddress:
    __addr = None
    def __init__(self, ad = None):
        self.__addr = c_ulonglong()
        if(ad != None):
            self.__addr = ad

    def get_addr(self):
        return self.__addr

    def set_addr(self, addr):
        self.__addr = addr


class TaskCode:
    __code = 0
    def __init__(self, int_c = None, task_code_c = None, name = None, type = None, pri = None, pool = None):
        if(int_c != None):
            self.__code = int_c
        elif(task_code_c != None):
            self.__code = task_code_c.__code
        else:
            self.__code = Native.dsn_task_code_register(name, type, pri, pool)

    @staticmethod
    def task_code_register(name, type, pri, pool):
        return Native.dsn_task_code_register(name, type, pri, pool)


class ThreadPoolCode:
    __code = 0

    def __init__(self, int_c = None, ThreadPoolCode_c = None, name = None):
        if(int_c != None):
            self.__code = int_c
        elif(ThreadPoolCode_c != None):
            self.__code = ThreadPoolCode_c.__code
        else:
            self.__code = Native.dsn_threadpool_code_register(name)

    @staticmethod
    def threadpool_code_register(name):
        return Native.dsn_threadpool_code_register(name)