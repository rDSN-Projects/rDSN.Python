SET TOP_DIR=%~dp0
SET bin_dir=%TOP_DIR%\scripts\windows
SET build_type=%1
SET build_dir=%~f2

IF "%build_type%" EQU "" SET build_type=Debug

IF "%build_dir%" EQU "" (
    CALL %bin_dir%\echoc.exe 4 please specify build_dir
    GOTO error
)

IF NOT "%VS140COMNTOOLS%"=="" (
    CALL "%VS140COMNTOOLS%\..\..\VC\vcvarsall.bat" amd64
    SET cmake_target=Visual Studio 14 2015 Win64
) ELSE (
    IF NOT "%VS120COMNTOOLS%"=="" (
        CALL "%VS120COMNTOOLS%\..\..\VC\vcvarsall.bat" amd64
        SET cmake_target=Visual Studio 12 2013 Win64
    )
)

IF "%cmake_target%"=="" (
    ECHO "error: Visusal studio 2013 or 2015 is not installed, please fix and try later"
    GOTO error
)

IF NOT EXIST "%bin_dir%\7z.exe" (
    CALL %bin_dir%\wget.exe --no-check-certificate https://github.com/imzhenyu/packages/raw/master/windows/7z.dll?raw=true
    CALL %bin_dir%\wget.exe --no-check-certificate https://github.com/imzhenyu/packages/raw/master/windows/7z.exe?raw=true
    @move 7z.dll %bin_dir%
    @move 7z.exe %bin_dir%
)

IF NOT EXIST "%TOP_DIR%\ext\cmake-3.2.2" (
    CALL %bin_dir%\wget.exe --no-check-certificate http://github.com/imzhenyu/packages/blob/master/windows/cmake-3.2.2.7z?raw=true
    CALL %bin_dir%\7z.exe x cmake-3.2.2.7z -y -o"%TOP_DIR%\ext\"
)

IF NOT EXIST "%build_dir%" mkdir %build_dir%

cd /d %build_dir%

echo CALL %TOP_DIR%\ext\cmake-3.2.2\bin\cmake.exe .. -DCMAKE_BUILD_TYPE="%build_type%" -G "%cmake_target%"
CALL %TOP_DIR%\ext\cmake-3.2.2\bin\cmake.exe .. -DCMAKE_BUILD_TYPE="%build_type%" -G "%cmake_target%"

msbuild dsn.python.sln /p:Configuration=%build_type%

cd ..\src
echo "[rDSN.Python] install help functions in python"
python setup.py install || echo "install help functions failed!" && exit /b
echo "[rDSN.Python] install pip"
python pip_install_for_windows.py || echo "install pip failed!" && exit /b

cd apps\rDSN.monitor
echo "[rDSN.Python] install dependency packages" 
python -m pip install -r requirement.txt || echo "install dependency packages failed!" && exit /b

cd ..\..\..
echo "[rDSN.Python] Successfully installed." 
goto exit

:error
    CALL %bin_dir%\echoc.exe 4  "Usage: build.cmd build_type(Debug|Release|RelWithDebInfo|MinSizeRel) build_dir"

:exit
