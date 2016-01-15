import sys
import os
import inspect
import threading
sys.path.append(os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe()))) + '/app_package')
from MonitorApp import *

def start_dsn():
    service_app = ServiceApp()
    app_dict['monitor'] = MonitorService
    service_app.register_app('monitor')
    if len(sys.argv) < 2:
        #rDSN.Monitor run as an embedded service
        print "rDSN.Monitor registered. Later run in embedded mode."

        Native.dsn_app_loader_signal()
        #to be fix, hangs forever now to keep python interpreter alive
        dummy_event = threading.Event()
        dummy_event.wait() 

    elif sys.argv[1] == 'standalone':
        #rDSN.Monitor run as a caller calling the monitored program 
        print "rDSN.Monitor running in standalone mode."

        argv = (c_char_p*2)()
        argv[0] = b'rDSN.Monitor.exe'
        argv[1] = b'config.ini'
        
        Native.dsn_run(2, argv, c_bool(1))

    else:
        print '''Wrong parameters. 
        Usage:
            For embedded mode, just add monitor in the config.ini and run the compiled programs:
                dsn.replication.simple_kv config.ini
            For standalone mode, run:
                python rDSN.Monitor.py standalone

        '''


if __name__ == '__main__':
    start_dsn()

    

