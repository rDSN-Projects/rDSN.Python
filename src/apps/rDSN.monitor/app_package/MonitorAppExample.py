import sys
import os
import time

from MonitorCodeDefinition import *
class MonitorServiceClient(ServiceApp):
    __server = None
    __echo_client = None
    __task = None

    def start(self, argv):
        return 0

    def stop(self, cleanup = 0):
        pass


