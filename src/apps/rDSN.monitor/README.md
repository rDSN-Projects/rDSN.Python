#rDSN.monitor

##Overview

**rDSN.monitor** is a test http server based on rDSN.Python. It allows users to easily get control of the whole system and view profiling data on web clients. 

In the future, we have two possible development directions: 
* We could use rDSN.Python as carrie. Using rDSN.Python to load any rDSN-based programs (notice that it's not necessarily written in Python) as dynamic libraries, rDSN.monitor could monitor any rDSN services.
* We join rDSN.monitor into rDSN as a regular app serving as daemon to provide web client control.

##Features

* System overview
* Profiling data visualization
* Remote file management (Up and down)
* Service automatic deployment and management //TODO

##To start

To start rDSN.monitor, you should install rDSN.Python first. Check [here](https://github.com/rDSN-Projects/rDSN.Python/blob/master/README.md) for more detail.

After you properly generated required dlls (dsn.core.dll,dsn.dev.python_helper.dll), please put them under "rDSN.monitor" directory. 

Before the next step, noticing that comparing to rDSN.Python, there are some other packages needed for hosting the http server.

```bash
pip install WebOb

pip install Paste

pip install webapp2

pip install jinja2
```

Then run command
```bash
cd .\rDSN.monitor
python server.py
```
The Python script will start a thread to run the rDSN-based demo "echo" and a thread to host the http server.

Now you could visit [here](http://localhost:8080).

