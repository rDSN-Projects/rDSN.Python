#rDSN.monitor

##Overview

**rDSN.monitor** is a test http server based on rDSN.Python. It allows users to easily get control of the whole system and view profiling data on web clients. 

**UPDATED** Now rDSN.Monitor supports both two modes! 
* Standalone Mode: rDSN.Monitor works as a carrier, creating a new thread to load target programs. 
* Embedded Mode: rDSN.Monitor works as a plugin, running as a daemon app inside the target programs. **(RECOMMENDED)** 

##Features

* System overview
* Profiling data visualization
* Online command line interface 
* Remote file editing 
* Service automatic deployment and management //TODO
* Solution wizard for developers //TODO
* Cluster overview  //TODO

##To start

To start rDSN.monitor, you should install rDSN.Python first. Check [here](https://github.com/rDSN-Projects/rDSN.Python/blob/master/README.md) for more detail.

After you properly generated required dlls (dsn.core.dll,dsn.dev.python_helper.dll), please put them under "rDSN.monitor" directory. 

Before the next step, noticing that comparing to rDSN.Python, there are some other python packages needed for hosting the http server. We recommend you to use [pip](https://pip.pypa.io/en/stable/installing/) to install them. Click the link to see the instructions to install pip.

When you finished installing pip, now run:
```bash
cd .\rDSN.monitor
pip install -r requirement.txt
```

##Scenario I: Standalone Mode
This mode is convenient when you're writing new functions for rDSN.Monitor and want to test it.


###Build dynamic link libraries of target program and modify config file
Take "simple_kv" as an example.

1. build dsn.replication.simple_kv.module in rDSN, we get dsn.replication.simple_kv.module.dll, put it under rDSN.monitor directory.
2. modify config.ini, set "dmodule" param for each app.

###Launch target program and http server
Then run command
```bash
cd .\rDSN.monitor
python server.py standalone
```
The Python script will start a thread to run simple_kv and a thread to host the http server.

Now you could visit [here](http://localhost:8080).

##Scenario II: Embedded Mode
Embedded mode is in more common use.

###Modify config file to enable rDSN.Monitor
Added the following lines:

```bash
[apps.monitor]
name = monitor
type = monitor
pools = THREAD_POOL_DEFAULT
dmodule = dsn.dev.python_helper
dmodule_bridge_arguments = rDSN.Monitor.py
```
###Launch target program
Now you can directly run your target program!

Take "simple_kv" as an example.

```bash
dsn.replication.simple_kv.exe config.ini
```

The target prrogram will automatically startup with rDSN.Monitor on.
