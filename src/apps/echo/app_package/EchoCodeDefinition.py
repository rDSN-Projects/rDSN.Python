__author__ = 'v-lshen'

import sys
import os

from dev.python.ServiceApp import *

THREAD_POOL_DEFAULT = ThreadPoolCode.threadpool_code_register('THREAD_POOL_DEFAULT')
LPC_ECHO_TIMER1 = TaskCode.task_code_register('LPC_ECHO_TIMER1', dsn_task_type_t['TASK_TYPE_COMPUTE'], dsn_task_priority_t['TASK_PRIORITY_COMMON'], THREAD_POOL_DEFAULT)
LPC_ECHO_TIMER2 = TaskCode.task_code_register('LPC_ECHO_TIMER2', dsn_task_type_t['TASK_TYPE_COMPUTE'], dsn_task_priority_t['TASK_PRIORITY_COMMON'], THREAD_POOL_DEFAULT)
RPC_ECHO = TaskCode.task_code_register('RPC_ECHO', dsn_task_type_t['TASK_TYPE_RPC_REQUEST'], dsn_task_priority_t['TASK_PRIORITY_COMMON'], THREAD_POOL_DEFAULT)
