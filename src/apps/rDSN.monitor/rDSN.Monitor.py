import sys
import os
import threading
sys.path.append(os.getcwd() + '/app_package')
from MonitorApp import *

def start_dsn():
    service_app = ServiceApp()
    app_dict['monitor'] = MonitorService
    service_app.register_app('monitor')
    if len(sys.argv) < 2:
        #rDSN.Monitor run as an embedded service
        print "rDSN.Monitor runs in embedded mode"

        Native.dsn_app_loader_signal()
        #to be fix, hangs forever now to keep python interpreter alive
        dummy_event = threading.Event()
        dummy_event.wait() 

    elif sys.argv[1] == 'standalone':
        #rDSN.Monitor run as a caller calling the monitored program 
        print "rDSN.Monitor runs in standalone mode"

        argv = (c_char_p*2)()
        argv[0] = b'rDSN.Monitor.exe'
        argv[1] = b'config.ini'
        
        Native.dsn_run(2, argv, c_bool(1))

if __name__ == '__main__':
    start_dsn()

    

