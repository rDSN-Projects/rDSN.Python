#!/bin/bash
set -e
printf "%s\n" "${DSN_ROOT:?You must set DSN_ROOT}"
echo "[rDSN.Python] cmake"

mkdir -p builder

cd builder
cmake ..

echo "[rDSN.Python] make"
make install

echo "[rDSN.Python] install python2.7"
sudo apt-get install -y python2.7
echo "[rDSN.Python] install pip"
sudo apt-get install -y python-pip
cd ../src
sudo python setup.py install

echo "[rDSN.Python] install python dependency packages"
cd apps/rDSN.monitor
sudo pip install -r requirement.txt

echo "[rDSN.Python] install successfully!"

 
