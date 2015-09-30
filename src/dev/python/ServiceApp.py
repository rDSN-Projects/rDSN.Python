__author__ = 'v-lshen'

from .Utils import *


class ServiceApp:

    @staticmethod
    def app_create(tname):
        # create in python
        obj = app_dict[tname]()
        object_dict[id(obj)] = obj
        return id(obj)

    @staticmethod
    def app_start(app, argc, argv):
        # start in python
        obj = object_dict[app]
        r = obj.start(argv)
        return r

    @staticmethod
    def app_destroy(app, cleanup): # TODO
        # destroy in python
        obj = object_dict[app]
        obj.stop()
        return

    @staticmethod
    def register_app(type_name):
        Native.dsn_register_app_role(type_name, 'app_create', 'app_start', ServiceApp.app_destroy)
        return