#rDSN.monitor

##Overview

**rDSN.monitor** is a test version of rDSN.Python. It allows users to easily view profiling data on web clients. We plan to combine this component into rDSN and any rDSN-based programs (notice that it's not bn 


##To start

To start rDSN.monitor, you should install rDSN.Python first.

After you properly generated required dlls (dsn.core.dll,dsn.dev.python_helper.dll), please put them under "/rDSN.monitor" directory. 

Comparing to rDSN.Python, there's some other packages needed for http server.

$ pip install WebOb
$ pip install Paste
$ pip install webapp2

Then run the "server.py". The Python script will start a thread to run the rDSN-based demo "echo" and a thread to host the http server.

Now you could visit [here](http://localhost:8080) to see the overview and profiling data of the whole system.

