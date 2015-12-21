set /p DUMMY=[rDSN.Python] please run C:\Program Files (x86)\Microsoft Visual Studio 12.0\VC\vcvarsall.bat amd64 first
mkdir builder
cd builder
echo "[rDSN.Python] cmake"
cmake .. -G "NMake Makefiles" || echo "cmake failed!" && exit /b
echo "[rDSN.Python] nmake"
nmake || echo "nmake failed!" && exit /b
echo "[rDSN.Python] nmake install"
nmake install || echo "nmake install failed!" && exit /b 

cd ..\src
echo "[rDSN.Python] install help functions in python"
python setup.py install || echo "install help functions failed!" && exit /b
echo "[rDSN.Python] install pip"
python pip_install_for_windows.py || echo "install pip failed!" && exit /b

cd apps\rDSN.monitor
echo "[rDSN.Python] install dependency packages" 
pip install -r requirement.txt || echo "install dependency packages failed!" && exit /b
