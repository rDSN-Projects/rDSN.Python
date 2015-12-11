# rDSN.Python
Python dev library atop of rDSN's C service API

## Overview
rDSN.Python is a Python library enabling users to run rDSN apps written in Python, or rDSN apps written in C/C++ compiled as dynamic-link libraries. 

We also provide a special app called "rDSN.Monitor" as a monitor panel for better observation on system running information.

## Setup
_for Linux_
1. build [rDSN](https://github.com/imzhenyu/rDSN) -> libdsn.core.so
2. run **build.sh**, it will automatically install everything for rDSN.Python and rDSN.monitor.

_for Windows_
1. build [rDSN](https://github.com/imzhenyu/rDSN) -> dsn.core.dll
2. build python_helper(rDSN.Python/src/dev/python_helper) with dsn.core.dll -> dsn.dev.python_helper.dll 
3. copy dsn.core.dll and python_helper.dll under the root of app folder(echo, rDSN.monitor and etc.)
4. install python dev(rDSN.Python/src), by running:
```bash
python setup.py install
```
Setup finished.

## Run apps
To run the echo, a simple python rDSN app, you just need:
```bash
python EchoMain.py
```

To run rDSN.Monitor, you could check readme file under the rDSN.Monitor.
