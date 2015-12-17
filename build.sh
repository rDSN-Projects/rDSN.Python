#!/bin/bash
set -e
printf "%s\n" "${DSN_ROOT:?You must set DSN_ROOT}"
echo "[rDSN.Python] cmake"

mkdir -p builder

cd builder
cmake ..

echo "[rDSN.Python] make"
make install

cd ..

echo "[rDSN.Python] install python2.7"
sudo apt-get install -y python2.7


echo "[rDSN.Python] Install virtualenv"
sudo pip install virtualenv

echo "[rDSN.Python] create virtualenv"
virtualenv venv
. venv/bin/activate

echo "[rDSN.Python] set virtual env successfully!"

cd ..

cd ./src
python setup.py install

echo "[rDSN.Python] install python dependency packages"
cd apps/rDSN.monitor
pip install -r requirement.txt

cd ../../..
virtualenv --relocatable venv


echo "[rDSN.Python] install successfully!"

 
