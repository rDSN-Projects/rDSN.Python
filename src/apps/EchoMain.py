__author__ = 'v-lshen'

from python_dev_v2.apps.EchoAppExample import *


def start():
    argv = (c_char_p*2)()

    argv[0] = b'echo.exe'
    argv[1] = b'config.ini'
    service_app = ServiceApp()

    app_dict['client'] = EchoServiceClient
    app_dict['server'] = EchoServiceServer

    service_app.register_app('client')
    service_app.register_app('server')

    Native.dsn_run(2, argv, c_bool(1))

if __name__ == '__main__':
    start()